# ScrapSetu — AI-Powered Circular Economy & Resource Intelligence Platform

ScrapSetu is an enterprise-oriented circular resource intelligence platform designed to connect waste generators, informal waste collectors, authorized recyclers, and municipal operators.

## Problem Statement

Urban waste management and resource recovery ecosystems in emerging economies face severe inefficiencies, including:
- Low material recovery rates due to lack of item-level identification and safety awareness at the collection point.
- Information asymmetry and unfair pricing exploitation experienced by informal waste collectors (kabadiwalas/ragpickers).
- Inefficient municipal logistics with static, non-optimized collection routes.
- Lack of verifiable traceability and compliance for authorized recycling plants and extended producer responsibility (EPR) mandates.

ScrapSetu bridges these gaps by providing AI-driven multimodal material classification, deterministic safety guardrails, circular decision intelligence, commodity price transparency, and dynamic collection logistics.

## Planned Core Capabilities

- **Confidence-Aware Multimodal Waste Classification**: Vision-based identification of materials, components, and condition assessments.
- **Deterministic Safety Guardrails**: Hard-coded safety rules and immediate hazard guidance for hazardous waste, chemicals, and pressurized items.
- **Circular Decision Intelligence**: Multi-tier evaluation engine advising whether an item should be reused, refurbished, harvested for components, or recycled.
- **Commodity Price Discovery & Disassembly Arbitrage**: Real-time market valuation and component-level teardown yield analysis.
- **Digital Waste Lots & Verifiable Handovers**: Cryptographically signed digital lot tokens with QR/OTP-based chain-of-custody transfer verification.
- **Geospatial Recycler Matching**: PostGIS-powered matching of waste lots with certified, authorized recyclers based on material type and proximity.
- **Smart-Bin Telemetry & Dynamic Routing**: ESP32-based ultrasonic and weight telemetry over MQTT feeding a Capacitated Vehicle Routing Problem (CVRP) solver for dynamic collection scheduling.

## High-Level Technology Stack

- **Frontend**: Progressive Web App (PWA) / Responsive Web UI (TypeScript, modern web framework).
- **Backend Services**: Python, FastAPI, Pydantic data validation.
- **Data & Storage**: PostgreSQL with PostGIS extension, Amazon S3 for media storage.
- **Cloud & AI Orchestration**: Amazon Bedrock (multimodal models), Amazon SageMaker (custom models), AWS IoT Core (MQTT telemetry), Amazon SQS / EventBridge (event routing), Amazon CloudWatch.

## Project Structure

The repository is structured into three primary directories:

```text
ScrapSetu/
├── frontend/          # Collector PWA and administrative web interfaces
├── backend/           # API services, decision engine, AI pipelines, and IoT handlers
└── docs/              # Architecture specifications, API schemas, research, and ADRs
```

- [`frontend/`](./frontend/): Contains client-side user interfaces, offline-first syncing logic, and collector tooling.
- [`backend/`](./backend/): Houses core backend services, circular algorithms, database models, and AWS service integrations.
- [`docs/`](./docs/): Centralized repository for system design, API contracts, research benchmarks, AWS architecture, setup instructions, and decision records.

## Project Status

> **Status: Initial scaffolding**
>
> The codebase is currently in its initial repository setup and architectural planning phase. Application services, user interfaces, machine learning models, cloud infrastructure, and hardware integrations are actively under development and have not yet been implemented.

## Prerequisites for Future Development

When implementation begins, local development will require:

- **Python**: Version 3.11+
- **Node.js**: Version 20+ LTS (with npm / pnpm / yarn)
- **Database**: PostgreSQL 15+ with PostGIS extension (or local Docker container)
- **AWS CLI**: Configured with appropriate local credentials or IAM profile (for cloud service integration)
- **Git**: For version control

## Documentation

Comprehensive architecture documentation, API contracts, research plans, and setup guides are maintained in the [`docs/`](./docs/) directory:

- [System Architecture](./docs/architecture/)
- [API Contracts & Schemas](./docs/api/)
- [Research & Benchmarking](./docs/research/)
- [AWS Cloud Infrastructure](./docs/aws/)
- [Development Setup](./docs/setup/)
- [Architecture Decisions (ADRs)](./docs/decisions/)
