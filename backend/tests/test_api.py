from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "ScrapSetu"

def test_triage_high_confidence_preset():
    response = client.post("/api/v1/triage/analyze", json={"sample_item_id": "electric_motor"})
    assert response.status_code == 200
    data = response.json()
    assert data["confidence_tier"] == "HIGH"
    assert len(data["components"]) > 0
    assert data["hazard_analysis"]["is_hazardous"] is False

def test_triage_swollen_battery_hazard_override():
    response = client.post("/api/v1/triage/analyze", json={"sample_item_id": "swollen_laptop"})
    assert response.status_code == 200
    data = response.json()
    assert data["hazard_analysis"]["is_hazardous"] is True
    assert data["hazard_analysis"]["battery_swollen"] is True
    assert "DETERMINISTIC SAFETY OVERRIDE" in data["hazard_analysis"]["containment_protocol"]

def test_triage_medium_confidence_clarification():
    response = client.post("/api/v1/triage/analyze", json={"sample_item_id": "copper_cable"})
    assert response.status_code == 200
    data = response.json()
    assert data["confidence_tier"] == "MEDIUM"
    assert data["clarification_prompt"] is not None

def test_valuation_disassembly_arbitrage():
    req = {
        "item_title": "Electric Motor Assembly",
        "total_gross_weight_kg": 6.5,
        "bulk_sale_price_per_kg": 45.0,
        "handling_overhead_cost": 30.0,
        "disassembly_labor_cost": 50.0,
        "components": [
            {"name": "Copper Windings", "estimated_weight_kg": 0.8, "index_price_per_kg": 650.0, "purity_factor": 0.95},
            {"name": "Steel Housing", "estimated_weight_kg": 4.5, "index_price_per_kg": 35.0, "purity_factor": 0.90},
            {"name": "Aluminum Endbells", "estimated_weight_kg": 1.2, "index_price_per_kg": 180.0, "purity_factor": 0.88}
        ]
    }
    response = client.post("/api/v1/valuation/calculate", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["recommendation"] == "DISASSEMBLE"
    assert data["arbitrage_net_gain"] > 0

def test_handover_flow_create_generate_qr_verify():
    # 1. Create lot
    lot_req = {
        "collector_id": "collector_001",
        "item_title": "Copper Motor Lot",
        "category": "Non-Ferrous Scrap",
        "components": [],
        "total_weight_kg": 6.5,
        "net_valuation": 510.0,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "hazard_status": {"is_hazardous": False}
    }
    res1 = client.post("/api/v1/lots/create", json=lot_req)
    assert res1.status_code == 200
    lot_data = res1.json()
    lot_id = lot_data["lot_id"]

    # 2. Generate signed QR token
    res2 = client.post("/api/v1/handover/generate-qr", json={"lot_id": lot_id, "collector_id": "collector_001"})
    assert res2.status_code == 200
    qr_data = res2.json()
    qr_token = qr_data["qr_token"]
    assert qr_data["qr_image_base64"].startswith("data:image/png;base64,")

    # 3. Recycler scans QR token & verifies handover
    verify_req = {
        "qr_token": qr_token,
        "recycler_id": "rec_eco_01",
        "scanned_latitude": 28.6139,
        "scanned_longitude": 77.2090
    }
    res3 = client.post("/api/v1/handover/verify", json=verify_req)
    assert res3.status_code == 200
    epr_data = res3.json()
    assert epr_data["epr_compliance_status"] == "VERIFIED_VALID"
    assert epr_data["digital_signature"].startswith("EPR-SHA256:")

def test_fleet_bins_and_cvrp_routing():
    # 1. Fetch smart bins
    res1 = client.get("/api/v1/fleet/bins")
    assert res1.status_code == 200
    bins = res1.json()
    assert len(bins) == 20

    # 2. Simulate tick
    res2 = client.post("/api/v1/fleet/simulate-tick")
    assert res2.status_code == 200

    # 3. Run CVRP route solver
    res3 = client.post("/api/v1/fleet/optimize-route?vehicle_capacity_kg=350.0")
    assert res3.status_code == 200
    cvrp = res3.json()
    assert cvrp["vehicle_id"] == "TRUCK-EV-01"
    assert len(cvrp["waypoints"]) > 0
    assert len(cvrp["route_polyline_coords"]) >= len(cvrp["waypoints"]) + 1
