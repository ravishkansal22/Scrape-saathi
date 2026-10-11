import hashlib
import json
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from app.config import settings
from app.platform.auth import actor, require_role, local_login, token_for, decode_handover, signing_key
from app.platform.store import transaction
from app.platform.models import *
from app.platform.core import *
from app.platform.media import save_evidence, read_evidence, speech, GUIDANCE
from app.schemas.triage import TriageAnalysisRequest
from app.services.ai_triage import ai_triage_service

router = APIRouter(prefix='/api/v2', tags=['Persistent workflow'])

def mutation(user, key, action, req, fn):
    with transaction() as db:
        ensure_profile(db, user)
        return do_once(db, user, key, action, req.model_dump(mode='json'), lambda: fn(db))

@router.get('/config')
def config():
    return {'auth_mode': settings.AUTH_MODE, 'cognito_domain': settings.COGNITO_DOMAIN,
            'cognito_client_id': settings.COGNITO_CLIENT_ID, 'frontend_url': settings.FRONTEND_URL,
            'store': settings.STORE_BACKEND, 'bedrock_model': settings.BEDROCK_MODEL_ID,
            'polly': settings.POLLY_ENABLED, 's3': bool(settings.AWS_S3_BUCKET),
            'location': settings.LOCATION_ENABLED, 'iot': bool(settings.AWS_IOT_ENDPOINT),
            'guidance': GUIDANCE, 'demo_accounts': list(LOCAL_USERS) if settings.AUTH_MODE == 'local' else []}

@router.post('/login')
def login(req: Login):
    return local_login(req.user, req.password)

@router.get('/state')
def state(user=Depends(actor)):
    with transaction() as db:
        ensure_profile(db, user)
        lots = [l for l in db.all('lot') if visible(db, l, user)]
        transactions = [t for t in db.all('transaction') if user.role == 'admin' or user.id in [t['sender_id'], t['receiver_id']]]
        facilities = db.all('facility')
        for facility in facilities:
            facility['eligible_now'] = bool(facility['verified'] and date(facility['permit_expires']) > datetime.now(timezone.utc))
        catalog = []
        for item in MATERIALS:
            price = db.get('price', item['id'])
            catalog.append({**item, 'unit': 'INR_PER_KG', 'reference': price,
                            'is_demo': price is None, 'reference_rate': price['rate'] if price else item['demo_rate']})
        earnings = sum(t.get('paid_amount', 0) for t in transactions if t['sender_id'] == user.id)
        pending = sum(max(0, t.get('final_amount', t['offer_amount'])-t.get('paid_amount', 0)) for t in transactions
                      if t['sender_id'] == user.id and t['status'] == 'CONFIRMED')
        return {'user': vars(user), 'lots': sorted(lots, key=lambda l: l['created_at'], reverse=True),
                'transactions': sorted(transactions, key=lambda t: t['created_at'], reverse=True),
                'facilities': facilities, 'materials': catalog,
                'pickups': [p for p in db.all('pickup') if user.role == 'admin' or user.id in [p['requester_id'], p['buyer_id']]],
                'earnings': {'received_inr': money(earnings), 'pending_inr': money(pending)},
                'bins': db.all('bin') if user.role == 'admin' else [], 'factors': db.all('factor')}

@router.post('/analyze')
def analyze(req: TriageAnalysisRequest, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'collector', 'vendor', 'recycler', 'admin')
    # Replay check before calling the external model; persistence commit handles concurrent duplicates.
    payload = req.model_dump(mode='json')
    with transaction() as db:
        key = user.id + ':' + idempotency_key
        existing = db.get('operation', key)
        if existing:
            return do_once(db, user, idempotency_key, 'analyze', payload, lambda: None)
    result = ai_triage_service.analyze_scrap(req).model_dump(mode='json')
    def create(db):
        analysis_id = uid('AI')
        record = {'id': analysis_id, 'owner_id': user.id, 'result': result, 'created_at': now()}
        db.put('analysis', analysis_id, record)
        return record
    return mutation(user, idempotency_key, 'analyze', req, create)

class Evidence(Input):
    image_base64: str = Field(max_length=5_000_100)

@router.post('/evidence')
def upload(req: Evidence, user=Depends(actor), idempotency_key: str = Header()):
    record = save_evidence(user, req.image_base64)
    return mutation(user, idempotency_key, 'evidence', req,
                    lambda db: (db.put('evidence', record['id'], record) or record))

@router.get('/evidence/{evidence_id}')
def evidence(evidence_id: str, user=Depends(actor)):
    with transaction() as db:
        record = db.require('evidence', evidence_id)
        allowed = record['owner_id'] == user.id or user.role == 'admin'
        allowed = allowed or any(l.get('evidence_id') == evidence_id and visible(db, l, user) for l in db.all('lot'))
        allowed = allowed or any(o.get('evidence_id') == evidence_id and visible(db, db.require('lot', o['lot_id']), user) for o in db.all('outcome'))
        if not allowed:
            raise HTTPException(403, 'Evidence is private to its parties')
    return Response(read_evidence(record), media_type=record['content_type'], headers={'Cache-Control': 'no-store'})

@router.post('/lots')
def create_lot(req: LotCreate, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'collector', 'vendor')
    def create(db):
        selected = material(req.material_id)
        analysis = db.require('analysis', req.analysis_id) if req.analysis_id else None
        if analysis and analysis['owner_id'] != user.id:
            raise HTTPException(403, 'Analysis belongs to another user')
        if req.evidence_id and db.require('evidence', req.evidence_id)['owner_id'] != user.id:
            raise HTTPException(403, 'Evidence belongs to another user')
        result = analysis['result'] if analysis else None
        needs_review = any(req.reported_hazards.values()) or not result or result['requires_manual_inspection'] or result['category'] != selected['category']
        record = {**req.model_dump(), 'id': uid('LOT'), 'creator_id': user.id, 'custodian_id': user.id,
                  'original_weight_kg': req.weight_kg, 'available_kg': req.weight_kg, 'version': 1,
                  'status': 'REVIEW_REQUIRED' if needs_review else 'AVAILABLE',
                  'hazardous': any(req.reported_hazards.values()) or bool(result and result['hazard_analysis']['is_hazardous']) or selected['category'] == 'hazardous',
                  'is_demo': settings.AUTH_MODE == 'local' or bool(result and result['analysis_source'] == 'demo'),
                  'participants': [user.id], 'parents': [], 'created_at': now(), 'updated_at': now()}
        db.put('lot', record['id'], record)
        event(db, user, record, 'COLLECTED', {'weight_kg': req.weight_kg, 'review_required': needs_review})
        return record
    return mutation(user, idempotency_key, 'create-lot', req, create)

@router.post('/lots/{lot_id}/review')
def review(lot_id: str, req: Review, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'admin')
    def update(db):
        lot = db.require('lot', lot_id)
        check_version(lot, req.version)
        if lot['status'] != 'REVIEW_REQUIRED':
            raise HTTPException(409, 'Only a pending-review lot can be reviewed')
        lot['status'] = 'AVAILABLE' if req.approved else 'REJECTED'
        lot['review'] = {'actor_id': user.id, 'notes': req.notes, 'at': now()}
        bump(lot)
        event(db, user, lot, 'REVIEWED', lot['review'])
        return lot
    return mutation(user, idempotency_key, 'review:' + lot_id, req, update)

@router.post('/lots/{lot_id}/offer')
def offer(lot_id: str, req: Offer, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'collector', 'vendor')
    def create(db):
        lot = db.require('lot', lot_id)
        owner(lot, user)
        check_version(lot, req.version)
        if lot['status'] != 'AVAILABLE' or lot['available_kg'] <= 0:
            raise HTTPException(409, 'Lot is reserved, consumed, or awaiting review')
        facility = db.require('facility', req.receiver_id)
        if req.receiver_id == user.id or not eligible_lot(facility, lot):
            raise HTTPException(422, 'Receiver permit/material scope is not currently eligible')
        if lot['available_kg'] < facility['minimum_kg']:
            raise HTTPException(422, 'Lot is below the receiver minimum quantity')
        amount = money(Decimal(str(lot['available_kg'])) * Decimal(str(req.rate)) - Decimal(str(req.fee)))
        if amount <= 0:
            raise HTTPException(422, 'Fee must be smaller than the gross offer')
        record = {'id': uid('TXN'), 'lot_id': lot_id, 'sender_id': user.id, 'receiver_id': req.receiver_id,
                  'sender_weight_kg': lot['available_kg'], 'rate': req.rate, 'fee': req.fee, 'offer_amount': amount,
                  'status': 'OFFERED', 'payment_status': 'PENDING', 'paid_amount': 0,
                  'version': 1, 'nonce': secrets.token_urlsafe(20), 'created_at': now(), 'updated_at': now()}
        price = db.get('price', lot['material_id'])
        record['price_warning'] = None
        if price and datetime.now(timezone.utc) - date(price['observed_at']) <= timedelta(days=7):
            if req.rate < price['rate'] * .7 or req.rate > price['rate'] * 1.3:
                record['price_warning'] = 'Offer differs by over 30% from the recent reference. Check grade, fees and transport; this is not a fraud finding.'
        record['qr_token'] = token_for({'transaction_id': record['id'], 'receiver_id': req.receiver_id, 'jti': record['nonce']})
        db.put('transaction', record['id'], record)
        lot['status'] = 'OFFERED'
        bump(lot)
        event(db, user, lot, 'OFFERED', {'transaction_id': record['id'], 'receiver_id': req.receiver_id, 'amount': amount})
        return record
    return mutation(user, idempotency_key, 'offer:' + lot_id, req, create)

@router.post('/transactions/{transaction_id}/reissue')
def reissue(transaction_id: str, req: Version, user=Depends(actor), idempotency_key: str = Header()):
    def update(db):
        tx = db.require('transaction', transaction_id)
        if tx['sender_id'] != user.id:
            raise HTTPException(403, 'Only sender can reissue')
        check_version(tx, req.version)
        if tx['status'] != 'OFFERED':
            raise HTTPException(409, 'Only pending offers can be reissued')
        tx['nonce'] = secrets.token_urlsafe(20)
        tx['qr_token'] = token_for({'transaction_id': tx['id'], 'receiver_id': tx['receiver_id'], 'jti': tx['nonce']})
        bump(tx)
        event(db, user, db.require('lot', tx['lot_id']), 'QR_REISSUED', {'transaction_id': tx['id']})
        return tx
    return mutation(user, idempotency_key, 'reissue:' + transaction_id, req, update)

@router.post('/handover/receive')
def receive(req: Receive, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'vendor', 'recycler')
    def update(db):
        token = decode_handover(req.token)
        tx = db.require('transaction', token['transaction_id'])
        if user.id != tx['receiver_id'] or user.id != token['receiver_id']:
            raise HTTPException(403, 'QR is addressed to another receiver')
        if tx['status'] != 'OFFERED' or tx['nonce'] != token['jti']:
            raise HTTPException(409, 'QR was consumed or replaced')
        lot = db.require('lot', tx['lot_id'])
        if not eligible_lot(db.require('facility', user.id), lot):
            raise HTTPException(403, 'Receiver authorization is no longer eligible')
        if req.deduction_kg >= req.measured_weight_kg:
            raise HTTPException(422, 'Deduction must be smaller than measured weight')
        effective = round(req.measured_weight_kg - req.deduction_kg, 6)
        amount = money(Decimal(str(effective))*Decimal(str(tx['rate']))-Decimal(str(tx['fee'])))
        if amount <= 0:
            raise HTTPException(422, 'Effective payout must be positive')
        tx.update(status='RECEIVED', receiver_weight_kg=req.measured_weight_kg, deduction_kg=req.deduction_kg,
                  effective_kg=effective, final_amount=amount, inspection_notes=req.notes,
                  weight_difference_kg=round(req.measured_weight_kg-tx['sender_weight_kg'], 6))
        bump(tx)
        event(db, user, lot, 'RECEIPT_PROPOSED', {'transaction_id': tx['id'], 'weight_kg': req.measured_weight_kg,
                                              'deduction_kg': req.deduction_kg, 'final_amount': amount})
        return tx
    return mutation(user, idempotency_key, 'receive', req, update)

@router.post('/transactions/{transaction_id}/accept')
def accept(transaction_id: str, req: Version, user=Depends(actor), idempotency_key: str = Header()):
    def update(db):
        tx = db.require('transaction', transaction_id)
        if tx['sender_id'] != user.id:
            raise HTTPException(403, 'Only sender can accept measured terms')
        check_version(tx, req.version)
        if tx['status'] != 'RECEIVED':
            raise HTTPException(409, 'Receiver must record measurements first')
        lot = db.require('lot', tx['lot_id'])
        owner(lot, user)
        if not eligible_lot(db.require('facility', tx['receiver_id']), lot):
            raise HTTPException(403, 'Receiver authorization has expired or been suspended')
        tx['status'] = 'CONFIRMED'
        tx['confirmed_at'] = now()
        bump(tx)
        lot.update(custodian_id=tx['receiver_id'], available_kg=tx['effective_kg'], status='AVAILABLE')
        lot['participants'] = list(set(lot['participants'] + [tx['receiver_id']]))
        bump(lot)
        event(db, user, lot, 'HANDOVER_CONFIRMED', {'transaction_id': tx['id'], 'from': user.id,
                                                'to': tx['receiver_id'], 'weight_kg': tx['effective_kg'], 'amount': tx['final_amount']})
        return tx
    return mutation(user, idempotency_key, 'accept:' + transaction_id, req, update)

@router.post('/transactions/{transaction_id}/report-payment')
def report_payment(transaction_id: str, req: Payment, user=Depends(actor), idempotency_key: str = Header()):
    def update(db):
        tx = db.require('transaction', transaction_id)
        check_version(tx, req.version)
        if user.id != tx['receiver_id']:
            raise HTTPException(403, 'Only buyer can report payment')
        if tx['status'] != 'CONFIRMED' or tx.get('payment_status') == 'REPORTED':
            raise HTTPException(409, 'Complete handover and resolve any pending report first')
        if money(req.amount + tx['paid_amount']) > tx['final_amount']:
            raise HTTPException(422, 'Payment exceeds outstanding amount')
        tx['payment_report'] = {**req.model_dump(exclude={'version'}), 'reported_at': now()}
        tx['payment_status'] = 'REPORTED'
        bump(tx)
        event(db, user, db.require('lot', tx['lot_id']), 'PAYMENT_REPORTED', tx['payment_report'])
        return tx
    return mutation(user, idempotency_key, 'payment:' + transaction_id, req, update)

@router.post('/transactions/{transaction_id}/confirm-payment')
def confirm_payment(transaction_id: str, req: Version, user=Depends(actor), idempotency_key: str = Header()):
    def update(db):
        tx = db.require('transaction', transaction_id)
        check_version(tx, req.version)
        if user.id != tx['sender_id']:
            raise HTTPException(403, 'Only seller can confirm money received')
        if tx['status'] != 'CONFIRMED' or tx['payment_status'] != 'REPORTED':
            raise HTTPException(409, 'No payment report awaiting confirmation')
        tx['paid_amount'] = money(tx['paid_amount'] + tx['payment_report']['amount'])
        tx['payment_status'] = 'PAID' if tx['paid_amount'] == tx['final_amount'] else 'PARTIALLY_PAID'
        bump(tx)
        event(db, user, db.require('lot', tx['lot_id']), 'PAYMENT_CONFIRMED', {'transaction_id': tx['id'], 'received_total': tx['paid_amount']})
        return tx
    return mutation(user, idempotency_key, 'confirm-payment:' + transaction_id, req, update)

@router.post('/transactions/{transaction_id}/dispute')
def dispute(transaction_id: str, req: Dispute, user=Depends(actor), idempotency_key: str = Header()):
    def update(db):
        tx = db.require('transaction', transaction_id)
        participant(tx, user)
        check_version(tx, req.version)
        if tx['status'] in ['DISPUTED', 'CANCELLED']:
            raise HTTPException(409, 'Transaction already disputed or cancelled')
        lot = db.require('lot', tx['lot_id'])
        if lot['status'] not in ['OFFERED', 'AVAILABLE'] or lot['custodian_id'] not in [tx['sender_id'], tx['receiver_id']]:
            raise HTTPException(409, 'Material has moved onward; contact an administrator for a downstream dispute')
        if any(t['lot_id'] == lot['id'] and t['id'] != tx['id'] and t['created_at'] > tx['created_at'] and t['status'] != 'CANCELLED' for t in db.all('transaction')):
            raise HTTPException(409, 'A later handover exists; contact an administrator')
        tx['before_dispute'] = {'status': tx['status'], 'payment_status': tx['payment_status'], 'lot_status': lot['status']}
        tx.update(status='DISPUTED', payment_status='DISPUTED', dispute_reason=req.reason)
        bump(tx)
        lot = db.require('lot', tx['lot_id'])
        lot['status'] = 'DISPUTED'
        bump(lot)
        event(db, user, lot, 'DISPUTED', {'transaction_id': tx['id'], 'reason': req.reason})
        return tx
    return mutation(user, idempotency_key, 'dispute:' + transaction_id, req, update)

@router.post('/transactions/{transaction_id}/cancel')
def cancel(transaction_id: str, req: Version, user=Depends(actor), idempotency_key: str = Header()):
    def update(db):
        tx = db.require('transaction', transaction_id)
        participant(tx, user)
        check_version(tx, req.version)
        if tx['status'] not in ['OFFERED', 'RECEIVED']:
            raise HTTPException(409, 'Confirmed or disputed transactions require manual resolution')
        tx['status'] = 'CANCELLED'
        bump(tx)
        lot = db.require('lot', tx['lot_id'])
        lot['status'] = 'AVAILABLE'
        bump(lot)
        event(db, user, lot, 'OFFER_CANCELLED', {'transaction_id': tx['id']})
        return tx
    return mutation(user, idempotency_key, 'cancel:' + transaction_id, req, update)

@router.get('/transactions/{transaction_id}/receipt')
def receipt(transaction_id: str, user=Depends(actor)):
    with transaction() as db:
        tx = db.require('transaction', transaction_id)
        participant(tx, user)
        data = {k:v for k,v in tx.items() if k not in ['nonce', 'qr_token']}
        data['notice'] = 'Internal handover receipt. Payments are acknowledged by parties, not verified by a bank. Not an official EPR certificate.'
        data['sha256'] = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        return data

@router.post('/lots/merge')
def merge(req: Merge, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'vendor')
    def create(db):
        if len(set(a.lot_id for a in req.allocations)) != len(req.allocations):
            raise HTTPException(422, 'Each source lot may appear once')
        sources = []
        for allocation in req.allocations:
            lot = db.require('lot', allocation.lot_id)
            owner(lot, user)
            check_version(lot, allocation.version)
            if lot['status'] != 'AVAILABLE' or allocation.weight_kg > lot['available_kg']:
                raise HTTPException(409, 'Source stock is unavailable or insufficient')
            if lot['hazardous']:
                raise HTTPException(422, 'Hazardous lots cannot be grouped automatically')
            sources.append(lot)
        if len(set(l['material_id'] for l in sources)) != 1:
            raise HTTPException(422, 'Only the same material can be aggregated')
        total = round(sum(a.weight_kg for a in req.allocations), 6)
        child = {'id': uid('LOT'), 'title': req.title, 'material_id': sources[0]['material_id'],
                 'weight_kg': total, 'original_weight_kg': total, 'available_kg': total, 'version': 1,
                 'creator_id': user.id, 'custodian_id': user.id, 'status': 'AVAILABLE', 'hazardous': False,
                 'participants': list(set([user.id] + [p for l in sources for p in l['participants']])),
                 'parents': [a.model_dump() for a in req.allocations], 'is_demo': any(l['is_demo'] for l in sources),
                 'created_at': now(), 'updated_at': now(), 'location': 'Aggregated at vendor', 'evidence_id': None}
        for lot, allocation in zip(sources, req.allocations):
            lot['available_kg'] = round(lot['available_kg'] - allocation.weight_kg, 6)
            if lot['available_kg'] == 0:
                lot['status'] = 'ALLOCATED'
            bump(lot)
            event(db, user, lot, 'ALLOCATED', {'child_lot_id': child['id'], 'weight_kg': allocation.weight_kg})
        db.put('lot', child['id'], child)
        event(db, user, child, 'AGGREGATED', {'parents': child['parents'], 'weight_kg': total})
        return child
    return mutation(user, idempotency_key, 'merge', req, create)

@router.post('/lots/{lot_id}/outcome')
def outcome(lot_id: str, req: Outcome, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'recycler')
    def create(db):
        lot = db.require('lot', lot_id)
        owner(lot, user)
        check_version(lot, req.version)
        if lot['status'] != 'AVAILABLE' or db.get('outcome', lot_id):
            raise HTTPException(409, 'Lot must be available and not previously processed')
        if not eligible_lot(db.require('facility', user.id), lot):
            raise HTTPException(403, 'Recycler permit is not eligible')
        evidence = db.require('evidence', req.evidence_id)
        if evidence['owner_id'] != user.id:
            raise HTTPException(403, 'Upload your own recovery evidence')
        if abs(req.recovered_kg + req.residue_kg - lot['available_kg']) > 0.000001:
            raise HTTPException(422, 'Recovered mass plus residue must equal the available input mass')
        factor = db.get('factor', lot['material_id'])
        record = {**req.model_dump(exclude={'version'}), 'id': uid('OUT'), 'lot_id': lot_id, 'actor_id': user.id,
                  'material_id': lot['material_id'], 'input_kg': lot['available_kg'], 'recorded_at': now(),
                  'yield_pct': round(req.recovered_kg / lot['available_kg'] * 100, 2), 'is_demo': lot['is_demo'],
                  'factor_snapshot': factor, 'evidence_status': 'recycler_reported',
                  'energy_kwh_estimate': round(req.recovered_kg*(factor['virgin_kwh_per_kg']-factor['secondary_kwh_per_kg']), 3) if factor else None}
        db.put('outcome', lot_id, record)
        lot['available_kg'] = 0
        lot['status'] = 'PROCESSED'
        bump(lot)
        event(db, user, lot, 'RECOVERY_REPORTED', record)
        return record
    return mutation(user, idempotency_key, 'outcome:' + lot_id, req, create)

@router.get('/lots/{lot_id}/trace')
def trace(lot_id: str, user=Depends(actor)):
    with transaction() as db:
        root = db.require('lot', lot_id)
        if not visible(db, root, user) and user.id not in root.get('participants', []):
            raise HTTPException(403, 'This lot belongs to other parties')
        ids, pending = set(), [lot_id]
        while pending:
            key = pending.pop()
            if key in ids:
                continue
            ids.add(key)
            lot = db.require('lot', key)
            pending.extend(p['lot_id'] for p in lot.get('parents', []))
        return {'lot': root, 'source_lots': [db.require('lot', key) for key in ids],
                'events': sorted([e for e in db.all('event') if e['lot_id'] in ids], key=lambda e:e['timestamp']),
                'outcomes': [o for o in db.all('outcome') if o['lot_id'] in ids]}

@router.put('/facility')
def facility(req: Facility, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'vendor', 'recycler')
    def update(db):
        for key in req.accepted_materials:
            material(key)
        for key, rate in req.offered_rates.items():
            if key not in req.accepted_materials or rate <= 0:
                raise HTTPException(422, 'Rates must be positive and match accepted materials')
        if req.permit_expires:
            date(req.permit_expires)
        record = {**req.model_dump(), 'id': user.id, 'role': user.role, 'verified': False, 'is_demo': False,
                  'permit_expires': req.permit_expires or '2000-01-01T00:00:00+00:00', 'updated_at': now()}
        db.put('facility', user.id, record)
        return record
    return mutation(user, idempotency_key, 'facility', req, update)

@router.post('/facilities/{facility_id}/verify')
def verify_facility(facility_id: str, req: VerifyFacility, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'admin')
    def update(db):
        record = db.require('facility', facility_id)
        if req.verified and (not record['permit_number'] or not record['permit_source'] or date(record['permit_expires']) <= datetime.now(timezone.utc)):
            raise HTTPException(422, 'A permit number, evidence source and future expiry are required')
        record.update(verified=req.verified, verification_notes=req.notes, verified_by=user.id, verified_at=now())
        db.put('verification', uid('VER'), {**record})
        return record
    return mutation(user, idempotency_key, 'verify-facility:' + facility_id, req, update)

@router.put('/prices/{material_id}')
def price(material_id: str, req: Price, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'admin')
    material(material_id)
    if date(req.observed_at) > datetime.now(timezone.utc):
        raise HTTPException(422, 'Price observation cannot be in the future')
    def update(db):
        record = {**req.model_dump(), 'material_id': material_id, 'unit': 'INR_PER_KG', 'entered_by': user.id, 'updated_at': now()}
        db.put('price', material_id, record)
        db.put('price_history', uid('PRICE'), record)
        return record
    return mutation(user, idempotency_key, 'price:' + material_id, req, update)

@router.post('/pickups')
def pickup(req: Pickup, user=Depends(actor), idempotency_key: str = Header()):
    def create(db):
        lot = db.require('lot', req.lot_id)
        owner(lot, user)
        if lot['status'] != 'AVAILABLE':
            raise HTTPException(409, 'Only available lots can request pickup')
        facility = db.require('facility', req.buyer_id)
        if not facility['pickup_available'] or not eligible_lot(facility, lot):
            raise HTTPException(422, 'Buyer cannot collect this material')
        if any(p['lot_id'] == req.lot_id and p['status'] in ['REQUESTED', 'ACCEPTED'] for p in db.all('pickup')):
            raise HTTPException(409, 'Lot already has an active pickup request')
        record = {**req.model_dump(), 'id': uid('PICK'), 'requester_id': user.id, 'status': 'REQUESTED',
                  'material_id': lot['material_id'], 'weight_kg': lot['available_kg'], 'created_at': now()}
        db.put('pickup', record['id'], record)
        return record
    return mutation(user, idempotency_key, 'pickup', req, create)

@router.post('/pickups/{pickup_id}')
def pickup_status(pickup_id: str, req: PickupUpdate, user=Depends(actor), idempotency_key: str = Header()):
    def update(db):
        record = db.require('pickup', pickup_id)
        if user.id != record['buyer_id'] and not (req.status == 'CANCELLED' and user.id == record['requester_id']):
            raise HTTPException(403, 'Only assigned buyer can update this pickup')
        allowed = {'REQUESTED': ['ACCEPTED', 'CANCELLED'], 'ACCEPTED': ['COMPLETED', 'CANCELLED']}
        if req.status not in allowed.get(record['status'], []):
            raise HTTPException(409, 'Invalid pickup transition')
        record['status'] = req.status
        record['updated_at'] = now()
        return record
    return mutation(user, idempotency_key, 'pickup-status:' + pickup_id, req, update)

@router.put('/impact/factors')
def factor(req: EnergyFactor, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'admin')
    material(req.material_id)
    def update(db):
        previous = db.get('factor', req.material_id)
        record = {**req.model_dump(), 'version': previous['version']+1 if previous else 1, 'entered_by': user.id, 'created_at': now()}
        db.put('factor', req.material_id, record)
        db.put('factor_history', req.material_id + ':' + str(record['version']), record)
        return record
    return mutation(user, idempotency_key, 'factor', req, update)

@router.get('/impact')
def impact(user=Depends(actor)):
    with transaction() as db:
        def totals(demo):
            lots = [l for l in db.all('lot') if l['is_demo'] == demo]
            outcomes = [o for o in db.all('outcome') if o['is_demo'] == demo]
            unique_received = set(t['lot_id'] for t in db.all('transaction') if t['status'] == 'CONFIRMED')
            # Only original lots contribute to collection; aggregated lots never add collection mass.
            originals = [l for l in lots if not l['parents']]
            return {'collected_kg': round(sum(l['original_weight_kg'] for l in originals), 6),
                    'original_lots_handed_over': sum(l['id'] in unique_received for l in originals),
                    'recovered_kg': round(sum(o['recovered_kg'] for o in outcomes), 6),
                    'residue_kg': round(sum(o['residue_kg'] for o in outcomes), 6),
                    'estimated_energy_kwh': round(sum(o['energy_kwh_estimate'] for o in outcomes if o['energy_kwh_estimate'] is not None), 3) if any(o['energy_kwh_estimate'] is not None for o in outcomes) else None,
                    'outcomes_without_factor': sum(o['factor_snapshot'] is None for o in outcomes)}
        return {'recorded': totals(False), 'demo': totals(True),
                'method': 'Recovered kg × (virgin − secondary kWh/kg). Estimates use the factor snapshot recorded at recovery. No transport benefit is added; avoid double counting lifecycle boundaries.',
                'notice': 'Recovery is recycler-reported with evidence, not independently audited. No carbon credit or official EPR certification is claimed.'}

@router.get('/guidance/{language}/{key}')
def audio(language: str, key: str):
    return Response(speech(language, key), media_type='audio/mpeg', headers={'Cache-Control': 'public, max-age=86400'})


class ResolveDispute(Version):
    notes: str = Field(min_length=10, max_length=1000)

@router.post('/transactions/{transaction_id}/resolve')
def resolve_dispute(transaction_id: str, req: ResolveDispute, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'admin')
    def update(db):
        tx = db.require('transaction', transaction_id)
        check_version(tx, req.version)
        if tx['status'] != 'DISPUTED':
            raise HTTPException(409, 'No open dispute')
        previous = tx['before_dispute']
        tx.update(status=previous['status'], payment_status=previous['payment_status'])
        tx['resolution'] = {'notes': req.notes, 'at': now(), 'actor_id': user.id}
        lot = db.require('lot', tx['lot_id'])
        lot['status'] = previous['lot_status']
        bump(lot)
        bump(tx)
        event(db, user, lot, 'DISPUTE_RESOLVED', tx['resolution'])
        return tx
    return mutation(user, idempotency_key, 'resolve:' + transaction_id, req, update)

@router.get('/partners')
def partners(material_id: str, latitude: float, longitude: float, weight_kg: float = 0, user=Depends(actor)):
    from app.platform.fleet import distance
    material(material_id)
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180 and weight_kg >= 0):
        raise HTTPException(422, 'Invalid coordinates or quantity')
    with transaction() as db:
        ensure_profile(db, user)
        matches = [{**f, 'distance_km': round(distance((latitude,longitude),(f['latitude'],f['longitude'])),2),
                    'distance_basis': 'Straight-line estimate, not travel distance'} for f in db.all('facility')
                   if f['id'] != user.id and eligible(f,material_id) and weight_kg >= f['minimum_kg']]
        return sorted(matches,key=lambda f:f['distance_km'])
