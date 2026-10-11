import base64
import io
import uuid
from datetime import datetime, timezone
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client=TestClient(app)
def headers(role, key=None):
    token=client.post('/api/v2/login',json={'user':role+'_demo','password':'scrapsetu-local'}).json()['access_token']
    return {'Authorization':'Bearer '+token,'Idempotency-Key':key or str(uuid.uuid4())}
def call(role,path,data=None,status=200,method='POST',key=None):
    r=client.request(method,'/api/v2'+path,json=data,headers=headers(role,key))
    assert r.status_code==status,r.text
    return r.json()
def lot(role='collector',weight=10):
    a=call(role,'/analyze',{'sample_item_id':'electric_motor'})
    return call(role,'/lots',{'title':'Demo copper','material_id':'copper','weight_kg':weight,'analysis_id':a['id']})
def transfer(l, sender='collector',receiver='recycler'):
    t=call(sender,f"/lots/{l['id']}/offer",{'version':l['version'],'receiver_id':receiver+'_demo','rate':100,'fee':0})
    t=call(receiver,'/handover/receive',{'token':t['qr_token'],'measured_weight_kg':l['available_kg'],'deduction_kg':1})
    return call(sender,f"/transactions/{t['id']}/accept",{'version':t['version']})
def image():
    f=io.BytesIO();Image.new('RGB',(10,10),'red').save(f,format='PNG');return base64.b64encode(f.getvalue()).decode()

def test_auth_and_legacy_routes():
    assert client.get('/health').status_code==200
    assert client.get('/api/v2/state').status_code==401
    assert client.post('/api/v1/lots/create',json={}).status_code==404
    call('collector','/impact/factors',{},422,'PUT')
    call('collector','/fleet/route',{'capacity_kg':100,'material_id':'copper'},403)

def test_persisted_idempotent_lot_and_manual_hazards():
    payload={'title':'Manual cable','material_id':'copper','weight_kg':5,'reported_hazards':{'sharp_edges':True}}
    a=call('collector','/lots',payload,key='offline-1');b=call('collector','/lots',payload,key='offline-1')
    assert a==b and a['status']=='REVIEW_REQUIRED' and a['hazardous']
    call('collector','/lots',{**payload,'weight_kg':6},409,key='offline-1')
    call('collector',f"/lots/{a['id']}/offer",{'version':1,'receiver_id':'recycler_demo','rate':100},409)
    call('collector',f"/lots/{a['id']}/review",{'version':1,'approved':True,'notes':'Inspected material'},403)
    reviewed=call('admin',f"/lots/{a['id']}/review",{'version':1,'approved':True,'notes':'Inspected material'})
    assert reviewed['status']=='AVAILABLE'
    with TestClient(app) as other:
        assert len(other.get('/api/v2/state',headers=headers('collector')).json()['lots'])==1

def test_full_handover_payment_recovery_trace():
    l=lot();t=transfer(l)
    assert t['sender_weight_kg']==10 and t['effective_kg']==9 and t['final_amount']==900
    call('recycler','/handover/receive',{'token':t['qr_token'],'measured_weight_kg':10},409)
    call('collector',f"/transactions/{t['id']}/report-payment",{'version':t['version'],'amount':900,'method':'CASH','reference':'Cash receipt'},403)
    t=call('recycler',f"/transactions/{t['id']}/report-payment",{'version':t['version'],'amount':900,'method':'CASH','reference':'Cash receipt'})
    call('recycler',f"/transactions/{t['id']}/confirm-payment",{'version':t['version']},403)
    t=call('collector',f"/transactions/{t['id']}/confirm-payment",{'version':t['version']})
    assert t['payment_status']=='PAID'
    assert call('collector','/state',method='GET')['earnings']['received_inr']==900
    receipt=call('collector',f"/transactions/{t['id']}/receipt",method='GET');assert 'qr_token' not in receipt
    evidence=call('recycler','/evidence',{'image_base64':image()})
    l=call('recycler','/state',method='GET')['lots'][0]
    payload={'version':l['version'],'recovered_kg':8,'residue_kg':1,'method':'Mechanical recovery','evidence_id':evidence['id']}
    call('recycler',f"/lots/{l['id']}/outcome",{**payload,'recovered_kg':9},422)
    call('recycler',f"/lots/{l['id']}/outcome",payload)
    call('recycler',f"/lots/{l['id']}/outcome",payload,409)
    impact=call('collector','/impact',method='GET');assert impact['demo']['recovered_kg']==8
    assert impact['demo']['estimated_energy_kwh'] is None
    trace=call('collector',f"/lots/{l['id']}/trace",method='GET');assert len(trace['events'])>=6
    call('collector',f"/transactions/{t['id']}/dispute",{'version':t['version'],'reason':'Incorrect payment'},409)

def test_qr_reissue_and_role_binding():
    l=lot();t=call('collector',f"/lots/{l['id']}/offer",{'version':1,'receiver_id':'recycler_demo','rate':100})
    call('vendor','/handover/receive',{'token':t['qr_token'],'measured_weight_kg':10},403)
    new=call('collector',f"/transactions/{t['id']}/reissue",{'version':1})
    call('recycler','/handover/receive',{'token':t['qr_token'],'measured_weight_kg':10},409)
    call('recycler','/handover/receive',{'token':new['qr_token'],'measured_weight_kg':10,'deduction_kg':10},422)

def test_aggregation_conserves_sources_and_versions():
    l=lot();transfer(l,receiver='vendor');l=call('vendor','/state',method='GET')['lots'][0]
    payload={'title':'Bulk copper','allocations':[{'lot_id':l['id'],'version':l['version'],'weight_kg':4}]}
    bulk=call('vendor','/lots/merge',payload)
    assert bulk['available_kg']==4
    call('vendor','/lots/merge',payload,409)
    state=call('vendor','/state',method='GET');assert sum(x['available_kg'] for x in state['lots'])==9
    assert len(call('collector',f"/lots/{bulk['id']}/trace",method='GET')['source_lots'])==2

def test_price_signal_pickup_and_fleet():
    call('admin','/prices/copper',{'rate':700,'source':'Test reference only','observed_at':datetime.now(timezone.utc).isoformat()},method='PUT')
    l=lot();p=call('collector','/pickups',{'lot_id':l['id'],'buyer_id':'recycler_demo','requested_window':'Tomorrow morning'})
    call('vendor',f"/pickups/{p['id']}",{'status':'ACCEPTED'},403)
    call('recycler',f"/pickups/{p['id']}",{'status':'ACCEPTED'})
    t=call('collector',f"/lots/{l['id']}/offer",{'version':1,'receiver_id':'recycler_demo','rate':100});assert t['price_warning']
    reading={'bin_id':'TEST1','latitude':28.64,'longitude':77.24,'capacity_kg':100,'weight_kg':85,'fill_pct':85,'material_id':'copper','timestamp':datetime.now(timezone.utc).isoformat()}
    call('admin','/fleet/simulate',reading)
    r=call('admin','/fleet/route',{'capacity_kg':100,'material_id':'copper'})
    assert r['planned_km']<=r['baseline_km'] and r['trips'][0]['load_kg']==85

def test_dispute_requires_admin_resolution_before_processing():
    l=lot();t=transfer(l)
    t=call('collector',f"/transactions/{t['id']}/dispute",{'version':t['version'],'reason':'Wrong grade price'})
    call('recycler',f"/transactions/{t['id']}/resolve",{'version':t['version'],'notes':'Both parties agreed to resume'},403)
    t=call('admin',f"/transactions/{t['id']}/resolve",{'version':t['version'],'notes':'Both parties agreed to resume'})
    assert t['status']=='CONFIRMED'
    assert call('recycler','/state',method='GET')['lots'][0]['status']=='AVAILABLE'

def test_suspend_receiver_blocks_receipt_and_matching():
    l=lot();t=call('collector',f"/lots/{l['id']}/offer",{'version':1,'receiver_id':'recycler_demo','rate':100})
    call('admin','/facilities/recycler_demo/verify',{'verified':False,'notes':'Permit suspended for test'})
    call('recycler','/handover/receive',{'token':t['qr_token'],'measured_weight_kg':10},403)
    matches=call('collector','/partners?material_id=copper&latitude=28&longitude=77&weight_kg=10',method='GET')
    assert all(f['id']!='recycler_demo' for f in matches)

def test_factor_snapshot_does_not_rewrite_past_impact():
    factor={'material_id':'copper','virgin_kwh_per_kg':5,'secondary_kwh_per_kg':2,'source':'Synthetic test factor only','geography':'Test','year':2026,'boundary':'Test boundary; not scientific data','uncertainty':'Test assumption'}
    call('admin','/impact/factors',factor,method='PUT')
    l=lot();transfer(l);l=call('recycler','/state',method='GET')['lots'][0]
    evidence=call('recycler','/evidence',{'image_base64':image()})
    call('recycler',f"/lots/{l['id']}/outcome",{'version':l['version'],'recovered_kg':8,'residue_kg':1,'method':'Test method','evidence_id':evidence['id']})
    call('admin','/impact/factors',{**factor,'virgin_kwh_per_kg':10},method='PUT')
    assert call('collector','/impact',method='GET')['demo']['estimated_energy_kwh']==24

def test_private_evidence_and_unknown_lot_have_no_fabricated_history():
    e=call('collector','/evidence',{'image_base64':image()})
    call('vendor',f"/evidence/{e['id']}",status=403,method='GET')
    call('collector','/lots/NONEXISTENT/trace',status=404,method='GET')

def test_validation_does_not_echo_image_or_password():
    r=client.post('/api/v2/evidence',json={'image_base64':123,'private':'SECRET'},headers=headers('collector'))
    assert r.status_code==422 and 'SECRET' not in r.text and '"input"' not in r.text

def test_hazardous_metal_requires_specialist_scope_even_after_review():
    from app.platform.store import transaction
    l=call('collector','/lots',{'title':'Contaminated copper','material_id':'copper','weight_kg':5,'reported_hazards':{'chemical_leak':True}})
    l=call('admin',f"/lots/{l['id']}/review",{'version':1,'approved':True,'notes':'Requires specialist hazardous handling'})
    with transaction() as db:
        db.require('facility','recycler_demo')['accepted_materials']=['copper']
    call('collector',f"/lots/{l['id']}/offer",{'version':l['version'],'receiver_id':'recycler_demo','rate':100},422)
