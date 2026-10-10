# ScrapSetu — AI-Powered Circular Economy & Resource Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg)](https://postgis.net/)
[![Amazon Bedrock](https://img.shields.io/badge/AWS-Amazon%20Bedrock-FF9900.svg)](https://aws.amazon.com/bedrock/)
[![AWS IoT Core](https://img.shields.io/badge/AWS-IoT%20Core-FF9900.svg)](https://aws.amazon.com/iot-core/)

ScrapSetu is an enterprise-grade circular resource intelligence platform designed to connect waste generators, informal waste collectors (*kabadiwalas* / ragpickers), authorized recyclers, and municipal operators.

---

## Problem Statement

Urban waste management and resource recovery ecosystems in emerging economies face severe structural inefficiencies:
- **Low Material Recovery Rates**: Lack of item-level identification and safety awareness at the collection point leads to down-cycling or landfilled recyclables.
- **Information Asymmetry & Price Exploitation**: Informal waste collectors operate without real-time market price discovery for disassembled raw materials and components.
- **Safety Hazards**: Unregulated handling of hazardous e-waste, lithium batteries, pressurized canisters, and toxic chemicals without automated guardrails.
- **Inefficient Municipal Fleet Logistics**: Static, non-optimized collection routes lead to overflowing bins and high operational overhead.
- **Traceability & EPR Compliance Deficit**: Inability to cryptographically verify chain-of-custody handovers for Extended Producer Responsibility (EPR) mandates and recycling audits.

ScrapSetu bridges these gaps through AI-driven multimodal material classification, deterministic safety guardrails, circular decision intelligence, commodity price transparency, and dynamic IoT-driven collection logistics.

---

## Core Capabilities

- **Confidence-Aware Multimodal Waste Classification**: Vision-based decomposition of scrap items into constituent materials, base metals, and condition grades powered by **Amazon Bedrock** (`Claude 3.5 Sonnet`).
- **Deterministic Safety Guardrails**: Hard-coded safety evaluation engine providing instant hazard warnings and step-by-step handling protocols for volatile/toxic items.
- **Circular Decision Intelligence**: Multi-tier evaluation advising optimal circular pathways: **Reuse &rarr; Refurbish &rarr; Harvest Components &rarr; Material Recycling**.
- **Commodity Price Discovery & Disassembly Arbitrage**: Real-time component yield estimation against live market rates to maximize informal collector earnings.
- **Cryptographic Digital Waste Lots & Dual-Key Handover**: HMAC-SHA256 signed dynamic QR code payloads and OTP validation ensuring verifiable, non-repudiable chain-of-custody.
- **Geospatial Recycler Matching**: High-performance spatial proximity and capability matching (`ST_DWithin`) using **PostgreSQL + PostGIS**.
- **Smart-Bin Telemetry & Dynamic Routing**: ESP32-based ultrasonic and weight telemetry ingested via **AWS IoT Core** (MQTT over TLS/X.509) feeding a Capacitated Vehicle Routing Problem (CVRP) solver.

---

## Technology Stack

| Layer | Technologies & Services |
| :--- | :--- |
| **Backend Web API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Database & Spatial** | PostgreSQL 15+, PostGIS extension, SQLAlchemy 2.0, GeoAlchemy2, Shapely, Alembic |
| **AI & Multimodal Vision** | Amazon Bedrock (Anthropic Claude 3.5 Sonnet), Amazon SageMaker |
| **IoT & Cloud Messaging** | AWS IoT Core (MQTT / TLS X.509), Amazon SQS, Amazon EventBridge |
| **Storage & Observability** | Amazon S3 (Pre-signed URL uploads & audit PDFs), Amazon CloudWatch |
| **Security & Auth** | HMAC-SHA256 QR signatures, Amazon Cognito / JWT, Passlib |
| **Frontend UI** | Mobile-First Progressive Web App (PWA), TypeScript |

---

## Project Structure

```text
ScrapSetu/
├── .env.example               # Environment variables specification template
├── .gitignore                 # Root version control ignore rules
├── LICENSE                    # Project license
├── README.md                  # Main platform documentation and overview
├── requirements.txt           # Python backend, geospatial, and AWS dependencies
├── backend/                   # FastAPI backend services, circular algorithms & AI pipelines
│   ├── .gitignore             # Backend isolation ignore rules
│   └── README.md              # Backend architecture guidelines
├── frontend/                  # Collector Progressive Web App (PWA) & admin dashboards
│   ├── .gitignore             # Frontend isolation ignore rules
│   └── README.md              # Frontend design guidelines
└── docs/                      # Centralized documentation hub
    ├── README.md              # Documentation index
    ├── api/                   # API contracts and OpenAPI schemas
    ├── architecture/          # System design, data flows, and subsystem architecture
    ├── aws/                   # Cloud architecture, IAM security, and cost models
    ├── decisions/             # Architecture Decision Records (ADRs)
    ├── research/              # Multimodal AI research and evaluation benchmarks
    └── setup/                 # Local developer setup and environment configuration
        └── environment.md     # Comprehensive cloud service configuration guide
```

---

## Cloud Services & Environment Configuration

Copy the example template to configure your local environment:
```bash
cp .env.example .env
```

### Environment Variables Matrix

| Service / Provider | Environment Variable | Purpose | How to Obtain |
| :--- | :--- | :--- | :--- |
| **AWS IAM Credentials** | `AWS_ACCESS_KEY_ID`<br>`AWS_SECRET_ACCESS_KEY`<br>`AWS_REGION` | Grants permission to invoke AWS cloud services (Bedrock, S3, IoT Core). | Generated in **AWS IAM Console** &rarr; **Security Credentials**. |
| **Amazon Bedrock (LLM / Vision)** | `BEDROCK_MODEL_ID`<br>*(e.g., `anthropic.claude-3-5-sonnet-20241022-v2:0`)* | Powers zero-shot multimodal visual scrap decomposition and hazard identification. | Enabled in **AWS Bedrock Console** &rarr; **Model Access**. |
| **Amazon S3 Storage** | `AWS_S3_BUCKET`<br>*(e.g., `scrapsetudb-scrap-images`)* | Stores user-uploaded scrap photos via pre-signed URLs and generates audit PDFs. | Created in **AWS S3 Console**. |
| **AWS IoT Core** | `AWS_IOT_ENDPOINT`<br>*(e.g., `a3xxxxxxx-ats.iot.us-east-1.amazonaws.com`)* | Ingests MQTT telemetry packets published by smart bin sensors over TLS/X.509. | Found in **AWS IoT Core Console** &rarr; **Settings**. |
| **Cryptographic QR Secret** | `SECRET_KEY` | Signs dynamic QR code payloads using HMAC-SHA256 for dual-key handover. | Configured locally in `.env` (Any secure random string). |
| **PostgreSQL + PostGIS** | `DATABASE_URL`<br>*(e.g., `postgresql://user:pass@localhost:5432/scrapsetudb`)* | Relational database ledger managing digital waste lots and spatial queries (`ST_DWithin`). | Local Docker PostgreSQL or AWS RDS for PostgreSQL. |

> For step-by-step instructions on setting up each service, see the [Environment Configuration Guide](docs/setup/environment.md).

---

## Quick Start & Local Setup

### 1. Prerequisites
- **Python**: 3.11+
- **Node.js**: 20+ LTS
- **Docker** (recommended for local PostgreSQL + PostGIS)
- **AWS CLI** (configured with appropriate IAM credentials)

### 2. Database Setup (Docker)
Start a local PostGIS container:
```bash
docker run --name scrapsetu-postgis \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=pass \
  -e POSTGRES_DB=scrapsetudb \
  -p 5432:5432 \
  -d postgis/postgis:15-3.3
```

### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Linux / macOS
source venv/bin/activate
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

---

## Documentation Index

- [Environment Setup & Credentials Guide](docs/setup/environment.md)
- [System Architecture](docs/architecture/)
- [API Contracts & OpenAPI Specifications](docs/api/)
- [AWS Cloud Infrastructure & Security](docs/aws/)
- [Architecture Decision Records (ADRs)](docs/decisions/)
- [AI Research & Benchmarks](docs/research/)
