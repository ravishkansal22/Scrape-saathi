# ScrapSetu — Backend Services & AI Orchestration

The `backend/` directory houses the core business logic, FastAPI microservices, circular decision engine, valuation formulas, and AWS cloud integrations for the **ScrapSetu** platform.

---

## Directory Structure

```
backend/
├── requirements.txt             # Python dependencies (FastAPI, Uvicorn, Pydantic, Pytest, Boto3)
├── tests/                       # Unit & integration test suites (100% pass rate)
└── app/
    ├── __init__.py
    ├── main.py                  # FastAPI application entrypoint, CORS configuration & health checks
    ├── config.py                # Environment configuration & settings
    ├── api/                     # REST API routers (/api/v1)
    │   ├── triage.py            # Multimodal AI classification & collector clarification
    │   ├── pricing.py           # Mandi benchmark price catalog
    │   ├── valuation.py         # Physical scale valuation calculations
    │   ├── handover.py          # Waste lot creation & signed QR code generation
    │   ├── transactions.py      # Dual-party transaction ledger & payment lifecycle
    │   ├── vendor.py            # Aggregator warehouse inventory & storage bays
    │   └── recyclers.py         # PostGIS spatial matching, intake scans & EPR certificates
    ├── schemas/                 # Pydantic v2 data models & request/response contracts
    └── services/                # Business logic engines & AWS Bedrock integrations
```

---

## Implemented Subsystems & Routers

1. **Multimodal AI Triage (`/api/v1/triage`)**:
   - Integrates with Amazon Bedrock (Claude 3.5 Sonnet) for visual assay.
   - 7 primary categories with confidence tiers.
   - Deterministic safety overrides for hazardous items (Li-ion batteries, chemicals, exposed wiring).
   - Segregation guidance with allowed and prohibited co-storage materials.

2. **Mandi Reference Pricing & Valuation (`/api/v1/pricing`)**:
   - Regional price catalog tracking scrap copper, brass, aluminium, PET flakes, and batteries.
   - Formula-driven valuation based exclusively on verified physical scale measurements ($W_{\text{actual}}$).

3. **Digital Waste Lots & Handover Tokens (`/api/v1/lots`, `/api/v1/handover`)**:
   - Waste lot generation with creator attribution and geolocation.
   - HMAC-SHA256 signed QR code token generation and validation.

4. **Transactions & Dual-Party Settlement (`/api/v1/transactions`)**:
   - Dual-state tracking: Material Transfer Status (`CREATED`, `OFFERED`, `ACCEPTED`, `RECEIVED`, `CONFIRMED`) and Payment Status (`PENDING`, `PAID`, `DISPUTED`).
   - Discrepancy logging between sender scale claims and receiver weighbridge measurements.

5. **Vendor Warehouse Management (`/api/v1/vendor`)**:
   - Inventory tracking categorized across segregated storage bays (`Bay A-1`, `Bay B-2`, `Bay C-1`, `Bay E-1`).
   - CPCB co-storage isolation compliance enforcement.
   - Onward commercial batch aggregation.

6. **Recycler Portal & Traceability Graph (`/api/v1/recyclers`)**:
   - PostGIS distance computation to accredited smelting and pelleting facilities.
   - Dual-party weighbridge intake confirmation with cryptographic intake hashes.
   - Circular recovery yield calculation and CPCB Form-2 EPR audit certificates.
   - Full chain-of-custody genealogy graph retrieval.

---

## Local Development & Setup

### 1. Environment Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# Linux / macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run API Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation will be available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

### 3. Run Test Suite
```bash
python -m pytest tests/ -v
```
All **7 test suites pass with 100% success**, covering triage, valuation, lot creation, handover QR tokens, transactions, and vendor inventory.
