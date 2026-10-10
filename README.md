# ScrapSetu — AI-Powered Circular Economy & Resource Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-61DAFB.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-336791.svg)](https://postgis.net/)
[![Amazon Bedrock](https://img.shields.io/badge/AI-Amazon%20Bedrock%20Claude%203.5-FF9900.svg)](https://aws.amazon.com/bedrock/)
[![AWS IoT Core](https://img.shields.io/badge/IoT-AWS%20IoT%20Core%20MQTT-FF9900.svg)](https://aws.amazon.com/iot-core/)
[![Tests](https://img.shields.io/badge/Tests-7%2F7%20Passed-brightgreen.svg)](backend/tests/)

**ScrapSetu** is an enterprise-grade circular resource intelligence platform designed to connect waste generators, informal waste collectors (*kabadiwalas* / ragpickers), authorized recyclers, and municipal fleet operators.

The platform provides end-to-end circular workflows: multimodal AI material triage, deterministic hazard safety overrides, component-level disassembly arbitrage valuation, cryptographically verifiable dual-key handovers with EPR audit trails, PostGIS recycler matching, and smart-bin CVRP dynamic routing.

---

## Architecture Overview

```mermaid
graph TB
    subgraph Client_Applications ["Client Applications (PWA & Portals)"]
        A1["📱 Collector PWA<br/>(Camera Triage, Disassembly Valuation, QR Gen)"]
        A2["🏢 Recycler Portal<br/>(QR Scanner, Permit Verification, EPR Receipts)"]
        A3["🚛 Municipal Fleet Portal<br/>(Interactive Map, Bin Telemetry, CVRP Routing)"]
    end

    subgraph Backend_Services ["FastAPI Backend Services (/api/v1)"]
        B1["🤖 AI Multimodal Triage Service<br/>(3-Tier Confidence + Hazard Overrides)"]
        B2["💰 Disassembly Arbitrage Engine<br/>(Yield Modeling & Bulk vs Teardown Value)"]
        B3["🔐 Cryptographic Handover Service<br/>(HMAC-SHA256 Dual-Key & EPR Audit Engine)"]
        B4["🗺️ Spatial Matching Engine<br/>(PostGIS ST_DWithin Proximity & Permits)"]
        B5["📦 CVRP Solver & Fleet Telemetry<br/>(Nearest-Neighbor Route Optimization)"]
    end

    subgraph AWS_Cloud_Services ["AWS Cloud & Spatial Infrastructure"]
        C1["🧠 Amazon Bedrock<br/>(Claude 3.5 Sonnet Vision Model)"]
        C2["🛢️ PostgreSQL + PostGIS<br/>(Spatial Indices & Digital Lot Ledger)"]
        C3["📡 AWS IoT Core<br/>(MQTT Telemetry over TLS / X.509)"]
        C4["🪣 Amazon S3<br/>(Scrap Photos & Audit Manifests)"]
        C5["📊 Amazon CloudWatch<br/>(Structured Logs & Telemetry Metrics)"]
    end

    A1 -->|REST API| B1
    A1 -->|REST API| B2
    A1 -->|REST API| B3
    A2 -->|REST API| B3
    A2 -->|REST API| B4
    A3 -->|REST API| B5

    B1 -->|Multimodal Inference| C1
    B3 -->|Persistence & Audit| C2
    B4 -->|Spatial Queries| C2
    B5 -->|Telemetry Ingest| C3
    B1 -->|Upload Pre-signed URLs| C4
    Backend_Services -.->|Metrics & Tracing| C5
```

---

## Core Capabilities & Subsystems

### 1. 🔍 Multimodal AI Waste Triage & 3-Tier Confidence Classifier
- **Vision Decomposition**: Decomposes complex assemblies (motors, batteries, e-waste, wiring) into component materials (Copper, Aluminum, Steel, Plastics, Rare Earths).
- **3-Tier Confidence Model**:
  - **HIGH ($\ge 0.85$)**: Direct automated valuation and pathway recommendation.
  - **MEDIUM ($0.60 - 0.84$)**: Presents interactive multi-choice visual clarification prompts (e.g. Pure Copper vs. Tin-Coated) that promote the item to High confidence upon collector response.
  - **LOW ($< 0.60$)**: Automatic flag for physical depot holding and manual inspection.
- **Deterministic Hazard Safety Overrides**: Hard-coded safety evaluation engine detecting swollen Li-ion batteries, chemical canisters, and toxic hazards with instant visual containment protocols.

```mermaid
flowchart TD
    Start["📸 Scrap Image Captured"] --> Bedrock["🧠 Amazon Bedrock Claude 3.5 Vision Analysis"]
    Bedrock --> HazardCheck{"⚠️ Hazard Detected?<br/>(Swollen Li-ion / Toxic / Puncture)"}
    
    HazardCheck -->|Yes| Override["🚨 DETERMINISTIC SAFETY OVERRIDE<br/>Trigger Sand-Buffered Isolation Protocol"]
    HazardCheck -->|No| ConfCheck{"Confidence Tier Check"}
    
    ConfCheck -->|Confidence >= 0.85| High["✅ HIGH CONFIDENCE<br/>Automated Valuation & Pathway"]
    ConfCheck -->|0.60 <= Conf < 0.85| Med["💬 MEDIUM CONFIDENCE<br/>Prompt Collector Clarification Modal"]
    ConfCheck -->|Confidence < 0.60| Low["📦 LOW CONFIDENCE<br/>Flag for Physical Depot Inspection"]

    Med -->|Collector Responds| High
```

---

### 2. 💎 Disassembly Arbitrage Engine
Calculates whether selling items in bulk or disassembling into pure constituent components yields higher profit for informal waste collectors after subtracting handling and labor costs:

$$\text{Net Value} = \sum_{i=1}^{n} \left( W_i \times P_i \times Q_i \right) - C_{\text{handling}}$$

Where:
- $W_i$: Component weight (kg)
- $P_i$: Market index price per kg
- $Q_i$: Material purity factor ($0.0 - 1.0$)
- $C_{\text{handling}}$: Teardown, safety, and labor deduction

---

### 3. 🔐 Cryptographic Dual-Key QR Handover & EPR Verification
Guarantees non-repudiation and traceability during collector-to-recycler material transfer:
1. **Dynamic QR Generation**: Collector generates a time-limited QR payload signed with **HMAC-SHA256**.
2. **Dual-Key Verification**: Recycler scans payload; server validates cryptographic signature, expiration timestamp, and recycler operating permits.
3. **EPR Audit Token**: Generates an immutable SHA-256 digital receipt verifying Extended Producer Responsibility compliance.

```mermaid
sequenceDiagram
    autonumber
    actor Collector as 📱 Informal Collector
    participant API as ⚙️ ScrapSetu API
    actor Recycler as 🏢 Authorized Recycler
    participant DB as 🛢️ PostGIS Ledger

    Collector->>API: POST /api/v1/lots/create (Lot Metadata & Geolocation)
    API->>DB: Store Digital Waste Lot (Status: CREATED)
    Collector->>API: POST /api/v1/handover/generate-qr
    API-->>Collector: Signed HMAC-SHA256 Dynamic QR Token (30 min expiry)
    
    Recycler->>Collector: Scans Dynamic QR via Camera
    Recycler->>API: POST /api/v1/handover/verify (QR Token + Recycler ID + GPS)
    API->>API: Verify HMAC Signature & Time Validity
    API->>DB: Update Lot Status to RECEIVED
    API-->>Recycler: Issue Cryptographic EPR Compliance Audit Receipt (SHA-256)
```

---

### 4. 🚛 Smart-Bin IoT Telemetry & Dynamic CVRP Fleet Routing
- **Virtual Smart-Bin Network**: Live tracking of 20 smart aggregation bins across Delhi NCR with ultrasonic fill levels (%), weight load cells (kg), battery levels, and threshold breach alarms.
- **Capacitated Vehicle Routing Problem (CVRP)**: Solves optimal multi-stop collection paths for bins reaching $\ge 80\%$ capacity while strictly adhering to vehicle payload limits (e.g. 350 kg).
- **Interactive Geospatial Visualizer**: Integrated Leaflet map showing real-time bin clusters, depot locations, and turn-by-turn collection polylines.

---

## API Endpoints Reference

All API routes are served under `/api/v1` with interactive OpenAPI documentation available at `/docs`:

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Triage** | `POST` | `/api/v1/triage/analyze` | Multimodal scrap image analysis & hazard detection |
| **Triage** | `POST` | `/api/v1/triage/clarify` | Collector clarification response for medium-confidence items |
| **Valuation** | `POST` | `/api/v1/valuation/calculate` | Disassembly arbitrage yield and net gain calculation |
| **Lots** | `POST` | `/api/v1/lots/create` | Creates a new digital waste lot token |
| **Lots** | `GET` | `/api/v1/lots/{lot_id}` | Retrieves waste lot status and history |
| **Handover** | `POST` | `/api/v1/handover/generate-qr` | Generates HMAC-SHA256 signed dynamic QR code payload |
| **Handover** | `POST` | `/api/v1/handover/verify` | Verifies dual-key handover and issues digital EPR receipt |
| **Recyclers** | `GET` | `/api/v1/recyclers/match` | PostGIS spatial proximity & permit suitability search |
| **Fleet** | `GET` | `/api/v1/fleet/bins` | Live telemetry for all 20 smart aggregation bins |
| **Fleet** | `POST` | `/api/v1/fleet/simulate-tick` | Simulates real-time bin fill events and weight updates |
| **Fleet** | `POST` | `/api/v1/fleet/optimize-route` | Solves CVRP collection routes for breached bins |
| **System** | `GET` | `/health` | API health and environment status |

---

## Repository Structure

```text
ScrapSetu/
├── .env.example                       # Cloud & backend environment template
├── .gitignore                         # Root version control ignore rules
├── LICENSE                            # Project license
├── README.md                          # Platform architecture and documentation
├── requirements.txt                   # Root dependency manifest
│
├── backend/                           # FastAPI Backend Application
│   ├── requirements.txt               # Backend Python dependencies
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint, middleware, routers
│   │   ├── config.py                  # Pydantic environment settings
│   │   ├── api/                       # REST route controllers
│   │   │   ├── triage.py              # AI vision classification endpoints
│   │   │   ├── valuation.py           # Disassembly arbitrage endpoints
│   │   │   ├── handover.py            # Digital waste lots & QR verification
│   │   │   ├── recyclers.py           # Spatial recycler matching
│   │   │   └── fleet.py               # Smart bin telemetry & CVRP routing
│   │   ├── schemas/                   # Pydantic v2 data models & request/response contracts
│   │   │   ├── triage.py
│   │   │   ├── valuation.py
│   │   │   ├── handover.py
│   │   │   └── fleet.py
│   │   └── services/                  # Core algorithmic and integration services
│   │       ├── ai_triage.py           # Bedrock Claude 3.5 Sonnet integration & safety overrides
│   │       ├── arbitrage.py           # Component yield calculation engine
│   │       ├── handover.py            # HMAC-SHA256 QR signing & EPR receipt generator
│   │       ├── spatial_matching.py    # PostGIS distance & permit matching service
│   │       ├── mock_fleet_daemon.py   # IoT smart bin telemetry simulator (20 bins)
│   │       └── cvrp_solver.py         # Capacitated Vehicle Routing Problem solver
│   └── tests/
│       └── test_api.py                # Pytest comprehensive test suite (7/7 tests)
│
├── frontend/                          # React + TypeScript + Vite PWA Application
│   ├── package.json                   # Frontend dependencies (Lucide, Leaflet, Tailwind)
│   ├── vite.config.ts                 # Vite bundler configuration
│   ├── index.html                     # HTML entrypoint
│   └── src/
│       ├── App.tsx                    # Main portal switcher (Collector, Recycler, Municipal)
│       ├── components/
│       │   ├── Header.tsx             # Navigation bar & backend health indicator
│       │   ├── CollectorView.tsx      # Collector camera triage, presets, arbitrage & QR token UI
│       │   ├── RecyclerPortalView.tsx # Recycler QR scanner, permit verification & EPR receipts
│       │   ├── MunicipalDashboardView.tsx # Smart bin fleet grid, tick simulator & CVRP dispatcher
│       │   └── InteractiveMap.tsx     # Leaflet geospatial map for bins and route polylines
│       └── services/
│           └── api.ts                 # Type-safe Axios/Fetch API client layer
│
└── docs/                              # Centralized Documentation Hub
    ├── README.md
    └── setup/
        └── environment.md             # Comprehensive AWS credentials and services setup guide
```

---

## Cloud Services & Environment Configuration

Copy the configuration template to initialize your local `.env`:
```bash
cp .env.example .env
```

| Service / Provider | Environment Variable | Purpose | How to Obtain |
| :--- | :--- | :--- | :--- |
| **AWS IAM Credentials** | `AWS_ACCESS_KEY_ID`<br>`AWS_SECRET_ACCESS_KEY`<br>`AWS_REGION` | Grants permission to invoke AWS cloud services (Bedrock, S3, IoT Core). | Generated in **AWS IAM Console** &rarr; **Security Credentials**. |
| **Amazon Bedrock (LLM / Vision)** | `BEDROCK_MODEL_ID`<br>*(e.g., `anthropic.claude-3-5-sonnet-20241022-v2:0`)* | Powers zero-shot multimodal visual scrap decomposition and hazard identification. | Enabled in **AWS Bedrock Console** &rarr; **Model Access**. |
| **Amazon S3 Storage** | `AWS_S3_BUCKET`<br>*(e.g., `scrapsetudb-scrap-images`)* | Stores user-uploaded scrap photos via pre-signed URLs and generates audit PDFs. | Created in **AWS S3 Console**. |
| **AWS IoT Core** | `AWS_IOT_ENDPOINT`<br>*(e.g., `a3xxxxxxx-ats.iot.us-east-1.amazonaws.com`)* | Ingests MQTT telemetry packets published by smart bin sensors over TLS/X.509. | Found in **AWS IoT Core Console** &rarr; **Settings**. |
| **Cryptographic QR Secret** | `SECRET_KEY` | Signs dynamic QR code payloads using HMAC-SHA256 for dual-key handover. | Configured locally in `.env` (Any secure random string). |
| **PostgreSQL + PostGIS** | `DATABASE_URL`<br>*(e.g., `postgresql://user:pass@localhost:5432/scrapsetudb`)* | Relational database ledger managing digital waste lots and spatial queries (`ST_DWithin`). | Local Docker PostgreSQL or AWS RDS for PostgreSQL. |

> For comprehensive step-by-step credentials acquisition instructions, refer to the [Environment Setup Guide](docs/setup/environment.md).

---

## Local Development & Quick Start

### 1. Prerequisites
- **Python**: Version 3.11+
- **Node.js**: Version 20+ LTS
- **Docker** (Optional, for local PostgreSQL + PostGIS)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node packages
npm install

# Start Vite development server
npm run dev
```
Access the web application at `http://localhost:3000` (or `http://localhost:5173`).

### 4. Running Backend Unit Tests
Execute the full test suite covering all 5 core subsystems:
```bash
cd backend
python -m pytest tests/ -v
```
**Test Suite Coverage:**
- `test_health_and_root`: API availability and metadata endpoints.
- `test_triage_high_confidence_item`: Multimodal component extraction for high-confidence scrap.
- `test_triage_hazard_override`: Deterministic safety guardrail enforcement for swollen batteries.
- `test_triage_medium_confidence_and_clarification`: Interactive clarification promotion flow.
- `test_disassembly_arbitrage_calculation`: Valuation yield math and net gain verification.
- `test_handover_flow_create_generate_qr_verify`: Cryptographic HMAC-SHA256 QR lifecycle & EPR receipt.
- `test_smart_bin_fleet_and_cvrp_optimization`: Smart-bin telemetry daemon and CVRP solver execution.

---

## License & Compliance
This project is licensed under the open-source [LICENSE](LICENSE). Built for Extended Producer Responsibility (EPR) compliance, circular material intelligence, and transparent informal sector empowerment.
