import json
import math
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Header, HTTPException
from app.config import settings
from app.platform.auth import actor, require_role
from app.platform.models import Telemetry, Route
from app.platform.store import transaction
from app.platform.core import date, now, material
from app.platform.api import mutation
from app.platform.media import aws

router = APIRouter(prefix='/api/v2/fleet', tags=['Fleet extension'])

def ingest(db, req):
    material(req.material_id)
    observed = date(req.timestamp)
    if observed > datetime.now(timezone.utc) + timedelta(minutes=5):
        raise HTTPException(422, 'Telemetry timestamp is in the future')
    if req.weight_kg > req.capacity_kg:
        raise HTTPException(422, 'Weight exceeds bin capacity')
    previous = db.get('bin', req.bin_id)
    if previous and observed <= date(previous['timestamp']):
        raise HTTPException(409, 'Duplicate or stale telemetry')
    record = {**req.model_dump(), 'threshold_breached': req.fill_pct >= 80, 'received_at': now()}
    db.put('bin', req.bin_id, record)
    return record

@router.post('/telemetry')
def telemetry(req: Telemetry, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'admin')
    return mutation(user, idempotency_key, 'telemetry', req, lambda db: ingest(db, req))

@router.post('/simulate')
def simulate(req: Telemetry, user=Depends(actor), idempotency_key: str = Header()):
    require_role(user, 'admin')
    req.simulated = True
    if settings.AWS_IOT_ENDPOINT:
        import boto3
        from botocore.config import Config
        client = boto3.client('iot-data', region_name=settings.AWS_REGION,
                    endpoint_url='https://' + settings.AWS_IOT_ENDPOINT.removeprefix('https://'),
                    config=Config(connect_timeout=5, read_timeout=10, retries={'total_max_attempts': 2}))
        client.publish(topic=settings.AWS_IOT_TOPIC, qos=1, payload=json.dumps(req.model_dump()).encode())
        return {'status': 'PUBLISHED_TO_IOT', 'simulated': True}
    return mutation(user, idempotency_key, 'simulate', req, lambda db: ingest(db, req))

def distance(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    value = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371*2*math.asin(min(1, math.sqrt(value)))

def plan(indices, bins, matrix, capacity, nearest):
    remaining, trips, km = list(indices), [], 0.0
    while remaining:
        load, current, trip = 0.0, 0, []
        while True:
            options = [i for i in remaining if load + bins[i-1]['weight_kg'] <= capacity]
            if not options:
                break
            chosen = min(options, key=lambda i: matrix[current][i]) if nearest else options[0]
            km += matrix[current][chosen]
            load += bins[chosen-1]['weight_kg']
            trip.append(bins[chosen-1]['bin_id'])
            remaining.remove(chosen)
            current = chosen
        km += matrix[current][0]
        trips.append({'bin_ids': trip, 'load_kg': round(load, 6)})
    return trips, km

@router.post('/route')
def route(req: Route, user=Depends(actor)):
    require_role(user, 'admin')
    material(req.material_id)
    with transaction() as db:
        bins = sorted([b for b in db.all('bin') if b['material_id'] == req.material_id and b['threshold_breached'] and b['weight_kg'] > 0
                       and datetime.now(timezone.utc) - date(b['timestamp']) < timedelta(hours=24)], key=lambda b:b['bin_id'])
    if not bins:
        raise HTTPException(422, 'No matching recent bins above the fill threshold')
    if req.material_id in ['battery', 'electronics']:
        raise HTTPException(422, 'Hazardous/electronic waste requires specialist dispatch')
    if len(bins) > 12:
        raise HTTPException(422, 'Pilot route limit: 12 bins')
    if any(b['weight_kg'] > req.capacity_kg for b in bins):
        raise HTTPException(422, 'A bin exceeds vehicle capacity; split its load before dispatch')
    points = [(req.depot_lat, req.depot_lng)] + [(b['latitude'], b['longitude']) for b in bins]
    mode = 'straight_line_estimate'
    if settings.LOCATION_ENABLED:
        positions = [{'Position': [p[1], p[0]]} for p in points]
        result = aws('geo-routes').calculate_route_matrix(Origins=positions, Destinations=positions,
                    RoutingBoundary={'Unbounded': True}, TravelMode='Truck')
        if result.get('ErrorCount', 0):
            raise HTTPException(502, 'Road route unavailable for one or more stops')
        matrix = [[cell['Distance']/1000 for cell in row] for row in result['RouteMatrix']]
        mode = 'amazon_location_road_matrix'
    else:
        matrix = [[distance(a, b) for b in points] for a in points]
    indices = list(range(1, len(points)))
    baseline_trips, baseline = plan(indices, bins, matrix, req.capacity_kg, False)
    trips, candidate = plan(indices, bins, matrix, req.capacity_kg, True)
    if candidate > baseline:
        trips, candidate = baseline_trips, baseline
    return {'mode': mode, 'algorithm': 'Capacity-constrained nearest-neighbor heuristic, capped at baseline; not a proof of optimality',
            'trips': trips, 'baseline_km': round(baseline, 3), 'planned_km': round(candidate, 3),
            'estimated_energy_avoided_kwh': round((baseline-candidate)*req.vehicle_kwh_per_km, 3),
            'vehicle_kwh_per_km_assumption': req.vehicle_kwh_per_km, 'simulated': any(b['simulated'] for b in bins),
            'notice': 'Same stops, weights, depot returns and capacity. Energy is an estimate, not measured savings.'}
