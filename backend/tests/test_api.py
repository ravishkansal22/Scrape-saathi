import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_and_health():
    res_root = client.get("/")
    assert res_root.status_code == 200
    data_root = res_root.json()
    assert data_root["status"] == "online"
    assert "subsystems" in data_root

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

def test_ai_triage_classification_and_segregation():
    # 1. High-confidence Recyclable Motor
    res1 = client.post("/api/v1/triage/analyze", json={"sample_item_id": "electric_motor"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["category"] == "recyclable"
    assert data1["confidence_tier"] == "HIGH"
    assert len(data1["materials_detected"]) > 0
    # Verify NO estimated weight in response components
    for comp in data1["materials_detected"]:
        assert "estimated_weight_kg" not in comp
    assert "segregation_guidance" in data1
    assert len(data1["segregation_guidance"]["compatible_materials"]) > 0

    # 2. Hazardous Swollen Battery (Deterministic Safety Override)
    res2 = client.post("/api/v1/triage/analyze", json={"sample_item_id": "swollen_laptop"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["category"] == "hazardous"
    assert data2["hazard_analysis"]["is_hazardous"] is True
    assert data2["hazard_analysis"]["battery_damage"] is True
    assert data2["requires_manual_inspection"] is True
    assert "SAFETY OVERRIDE" in data2["hazard_analysis"]["containment_protocol"]

    # 3. Medium Confidence Cable & Clarification Promotion
    res3 = client.post("/api/v1/triage/analyze", json={"sample_item_id": "copper_cable"})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["confidence_tier"] == "MEDIUM"
    assert data3["clarification_prompt"] is not None

    # Submit clarification
    res_clarify = client.post("/api/v1/triage/clarify", json={
        "item_name": "Heavy-Duty Industrial Wiring Cable",
        "selected_option_id": "pure_copper",
        "category": "recyclable"
    })
    assert res_clarify.status_code == 200
    data_clarify = res_clarify.json()
    assert data_clarify["confidence_tier"] == "HIGH"
    assert "Grade A" in data_clarify["materials_detected"][0]["purity_grade"]

def test_reference_pricing_and_measured_weight_valuation():
    # 1. Get Reference Price Catalog
    res_cat = client.get("/api/v1/pricing/catalog")
    assert res_cat.status_code == 200
    cat = res_cat.json()
    assert len(cat) >= 5
    copper_item = next(item for item in cat if "Copper" in item["material_name"])
    assert copper_item["reference_price"] > 500
    assert copper_item["price_source"] is not None
    assert copper_item["last_updated"] is not None

    # 2. Valuation calculation using actual scale measured weight
    res_val = client.post("/api/v1/pricing/calculate", json={
        "material_name": "Grade-A Bright Bare Copper Wire",
        "category": "Non-Ferrous Metals",
        "measured_weight_kg": 12.5,
        "condition_grade": "Clean / Unalloyed"
    })
    assert res_val.status_code == 200
    val_data = res_val.json()
    assert val_data["measured_quantity"] == 12.5
    assert val_data["quantity_type"] == "WEIGHT"
    assert val_data["unit"] == "INR_PER_KG"
    assert val_data["total_estimated_value"] == round(12.5 * 710.0, 2)
    assert val_data["net_payable_estimate"] > 0
    assert "12.50 kg measured on scale" in val_data["calculation_breakdown"]

def test_digital_waste_lot_and_qr_lifecycle():
    # 1. Create a digital waste lot with scale weight
    lot_req = {
        "creator_id": "kabadi_ramesh_01",
        "creator_name": "Ramesh Kumar",
        "creator_role": "KABADIWALA",
        "item_title": "Clean Brass Water Meter Valves",
        "category": "recyclable",
        "measured_weight_kg": 8.4,
        "item_count": 14,
        "condition": "Disassembled / Heavy",
        "origin_location": "Seelampur, Delhi"
    }
    res_create = client.post("/api/v1/lots/create", json=lot_req)
    assert res_create.status_code == 200
    lot = res_create.json()
    lot_id = lot["lot_id"]
    assert lot["measured_weight_kg"] == 8.4
    assert lot["status"] == "CREATED"
    assert len(lot["custody_history"]) == 1

    # 2. Generate HMAC-SHA256 Signed QR
    res_qr = client.post("/api/v1/handover/generate-qr", json={
        "lot_id": lot_id,
        "sender_id": "kabadi_ramesh_01",
        "sender_role": "KABADIWALA"
    })
    assert res_qr.status_code == 200
    qr_data = res_qr.json()
    qr_token = qr_data["qr_token"]
    assert qr_token is not None
    assert qr_data["qr_image_base64"].startswith("data:image/")

    # 3. Verify QR code
    res_verify = client.post(f"/api/v1/handover/verify-qr?qr_token={qr_token}")
    assert res_verify.status_code == 200
    ver_data = res_verify.json()
    assert ver_data["is_valid"] is True
    assert ver_data["lot_id"] == lot_id
    assert ver_data["measured_weight_kg"] == 8.4

def test_transaction_full_lifecycle_discrepancy_and_payments():
    # 1. Create Transaction Offer
    txn_req = {
        "lot_id": "LOT-7A9B1C2D",
        "sender_id": "kabadi_ramesh_01",
        "sender_name": "Ramesh Kumar (Kabadiwala)",
        "sender_role": "KABADIWALA",
        "receiver_id": "vendor_apex_metals_01",
        "receiver_name": "Apex Scrap Traders (Vendor)",
        "receiver_role": "VENDOR",
        "material_category": "recyclable",
        "item_title": "Induction Motor Copper Windings",
        "measured_weight_kg": 15.0,  # Sender claimed 15.0 kg
        "agreed_unit_price": 680.0,
        "payment_method": "UPI",
        "location_name": "Mayapuri Yard"
    }
    res_txn = client.post("/api/v1/transactions/create", json=txn_req)
    assert res_txn.status_code == 200
    txn = res_txn.json()
    txn_id = txn["transaction_id"]
    assert txn["transfer_status"] == "OFFERED"
    assert txn["payment_status"] == "PENDING"
    assert txn["final_payable_amount"] == 15.0 * 680.0

    # 2. Receiver confirms receipt with physical weighbridge measurement & contamination deduction
    # (Receiver scale reads 14.2 kg with 0.2 kg moisture/dirt deduction -> Effective 14.0 kg)
    res_confirm = client.post(f"/api/v1/transactions/{txn_id}/confirm-receipt", json={
        "receiver_id": "vendor_apex_metals_01",
        "receiver_measured_weight_kg": 14.2,
        "has_contamination": True,
        "contamination_weight_deduction_kg": 0.2,
        "inspection_notes": "Scale reading: 14.2 kg. 200g dirt deduction applied. Net: 14.0 kg."
    })
    assert res_confirm.status_code == 200
    confirmed_txn = res_confirm.json()
    assert confirmed_txn["transfer_status"] == "CONFIRMED"
    assert confirmed_txn["effective_weight_kg"] == 14.0
    assert confirmed_txn["final_payable_amount"] == 14.0 * 680.0  # ₹9520.0
    assert confirmed_txn["discrepancy"]["has_discrepancy"] is True
    assert confirmed_txn["discrepancy"]["weight_difference_kg"] == round(14.2 - 15.0, 2)
    assert len(confirmed_txn["audit_history"]) >= 2

    # 3. Update Payment Status to PAID via UPI
    res_pay = client.post(f"/api/v1/transactions/{txn_id}/update-payment", json={
        "updated_by_user_id": "vendor_apex_metals_01",
        "payment_status": "PAID",
        "amount_paid": 9520.0,
        "payment_method": "UPI",
        "payment_reference": "UPI/20261010/7766554433",
        "notes": "Settled instantly via UPI to Ramesh Kumar"
    })
    assert res_pay.status_code == 200
    paid_txn = res_pay.json()
    assert paid_txn["payment_status"] == "PAID"
    assert paid_txn["amount_paid_so_far"] == 9520.0
    assert paid_txn["payment_reference"] == "UPI/20261010/7766554433"

def test_vendor_portal_inspection_and_inventory():
    # 1. Vendor Dashboard
    res_dash = client.get("/api/v1/vendor/dashboard")
    assert res_dash.status_code == 200
    dash = res_dash.json()
    assert dash["total_inventory_weight_kg"] > 0
    assert len(dash["inventory_by_category"]) >= 3

    # 2. Vendor Incoming Lots
    res_incoming = client.get("/api/v1/vendor/incoming-lots")
    assert res_incoming.status_code == 200
    incoming = res_incoming.json()
    assert len(incoming) >= 1

    # 3. Vendor Physical Inspection & Offer
    first_lot = incoming[0]
    res_inspect = client.post("/api/v1/vendor/inspect", json={
        "lot_id": first_lot["lot_id"],
        "vendor_id": "vendor_apex_metals_01",
        "physical_scale_weight_kg": 14.0,
        "contamination_detected": False,
        "contamination_weight_deduction_kg": 0.0,
        "offered_price_per_kg": 690.0,
        "payment_method": "UPI",
        "inspection_notes": "Tested with XRF analyzer: 99.8% pure copper."
    })
    assert res_inspect.status_code == 200
    assert res_inspect.json()["status"] == "OFFER_SUBMITTED"

    # 4. Vendor Onward Bulk Lot Creation for Recycler
    res_bulk = client.post("/api/v1/vendor/create-onward-lot", json={
        "vendor_id": "vendor_apex_metals_01",
        "material_category": "recyclable",
        "material_name": "Grade-A Copper Wire Scrap",
        "aggregated_weight_kg": 250.0,
        "asking_price_per_kg": 720.0,
        "storage_origin_bay": "Bay A-1 (Secure Lockup)",
        "destination_facility": "EcoRecycle Smelting Plant"
    })
    assert res_bulk.status_code == 200
    bulk_lot = res_bulk.json()
    assert bulk_lot["measured_weight_kg"] == 250.0
    assert "LOT-BULK-" in bulk_lot["lot_id"]

def test_recycler_matching_intake_and_traceability_graph():
    # 1. Spatial Matching of Recyclers
    res_match = client.get("/api/v1/recyclers/match?lat=28.6139&lng=77.2090&category=e-waste")
    assert res_match.status_code == 200
    recs = res_match.json()
    assert len(recs) >= 1
    assert recs[0]["distance_km"] > 0
    assert recs[0]["active_epr_accreditation"] is True

    # 2. Get Traceability Graph
    res_graph = client.get("/api/v1/recyclers/traceability/LOT-4E8F2A10")
    assert res_graph.status_code == 200
    graph = res_graph.json()
    assert graph["lot_id"] == "LOT-4E8F2A10"
    assert graph["origin_collector_name"] is not None
    assert len(graph["custody_timeline"]) >= 2
    for node in graph["custody_timeline"]:
        assert node["custodian_role"] in ["KABADIWALA", "VENDOR", "RECYCLER", "GENERATOR"]
        assert node["timestamp"] is not None
