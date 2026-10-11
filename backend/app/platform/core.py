import copy
import hashlib
import json
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from app.config import settings
from app.platform.auth import LOCAL_USERS

MATERIALS = [
    {'id': 'copper', 'name': 'Clean copper scrap', 'category': 'recyclable', 'grade': 'Clean separated copper; inspect grade', 'demo_rate': 710},
    {'id': 'aluminium', 'name': 'Cast aluminium scrap', 'category': 'recyclable', 'grade': 'Separated cast aluminium', 'demo_rate': 175},
    {'id': 'pet', 'name': 'Clear PET bottles', 'category': 'recyclable', 'grade': 'Clean dry clear PET', 'demo_rate': 34},
    {'id': 'steel', 'name': 'Heavy steel scrap', 'category': 'recyclable', 'grade': 'Separated heavy steel', 'demo_rate': 38.5},
    {'id': 'electronics', 'name': 'Mixed electronics', 'category': 'e-waste', 'grade': 'Whole units; inspection needed', 'demo_rate': None},
    {'id': 'battery', 'name': 'Batteries / hazardous items', 'category': 'hazardous', 'grade': 'Specialist review required', 'demo_rate': None},
]

def now():
    return datetime.now(timezone.utc).isoformat()

def date(value):
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            raise ValueError()
        return parsed
    except (ValueError, AttributeError):
        raise HTTPException(422, 'Use an ISO timestamp with timezone')

def money(value):
    return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

def material(key):
    value = next((v for v in MATERIALS if v['id'] == key), None)
    if value is None:
        raise HTTPException(422, 'Select a supported material ID')
    return value

def uid(prefix):
    return prefix + '-' + uuid.uuid4().hex[:16]

def ensure_profile(db, user):
    if not db.get('user', user.id):
        db.put('user', user.id, vars(user).copy())
    if settings.AUTH_MODE == 'local':
        for key, profile in LOCAL_USERS.items():
            if not db.get('user', key):
                db.put('user', key, copy.deepcopy(profile))
        for role in ['vendor', 'recycler']:
            key = role + '_demo'
            if not db.get('facility', key):
                db.put('facility', key, {
                    'id': key, 'name': role.title() + ' Demo Facility', 'role': role,
                    'accepted_materials': [m['id'] for m in MATERIALS], 'offered_rates': {},
                    'minimum_kg': 0, 'latitude': 28.62, 'longitude': 77.22,
                    'pickup_available': True, 'permit_number': 'DEMO-NOT-A-REAL-PERMIT',
                    'permit_source': 'Local test fixture only',
                    'permit_expires': '2099-01-01T00:00:00+00:00', 'verified': True,
                    'is_demo': True, 'verified_at': now(), 'verification_notes': 'Local demo only',
                })

def event(db, user, lot, action, details):
    record = {'id': uid('EVT'), 'lot_id': lot['id'], 'actor_id': user.id, 'role': user.role,
              'action': action, 'timestamp': now(), 'details': details}
    record['digest'] = hashlib.sha256(json.dumps(record, sort_keys=True).encode()).hexdigest()
    db.put('event', record['id'], record)

def check_version(record, version):
    if record['version'] != version:
        raise HTTPException(409, 'This record changed. Refresh before retrying.')

def bump(record):
    record['version'] += 1
    record['updated_at'] = now()

def owner(lot, user):
    if lot['custodian_id'] != user.id:
        raise HTTPException(403, 'Only the current custodian can perform this action')

def participant(tx, user):
    if user.role != 'admin' and user.id not in [tx['sender_id'], tx['receiver_id']]:
        raise HTTPException(403, 'This transaction belongs to other parties')

def visible(db, lot, user):
    return (user.role == 'admin' or user.id in lot.get('participants', []) or user.id in [lot['creator_id'], lot['custodian_id']]
            or any(t['lot_id'] == lot['id'] and user.id in [t['sender_id'], t['receiver_id']] for t in db.all('transaction')))

def eligible(facility, material_id):
    return (facility.get('verified', False) and material_id in facility['accepted_materials']
            and date(facility['permit_expires']) > datetime.now(timezone.utc)
            and (settings.AUTH_MODE == 'local' or not facility.get('is_demo')))

def do_once(db, user, operation_id, action, payload, execute):
    if not operation_id or len(operation_id) > 100:
        raise HTTPException(422, 'An Idempotency-Key of at most 100 characters is required')
    key = user.id + ':' + operation_id
    fingerprint = hashlib.sha256(json.dumps([action, payload], sort_keys=True).encode()).hexdigest()
    previous = db.get('operation', key)
    if previous:
        if previous['fingerprint'] != fingerprint:
            raise HTTPException(409, 'Operation ID was already used with different content')
        return copy.deepcopy(previous['result'])
    result = execute()
    db.put('operation', key, {'fingerprint': fingerprint, 'result': copy.deepcopy(result), 'at': now()})
    return result


def eligible_lot(facility, lot):
    # Hazard flags survive material selection and manual review. Ordinary metal
    # acceptance alone must never authorize a hazardous handover.
    return eligible(facility, lot["material_id"]) and (not lot.get("hazardous") or eligible(facility, "battery"))
