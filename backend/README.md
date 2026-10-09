# ScrapSetu — Backend Services & AI Orchestration

## Overview

The `backend/` directory contains the core services, API layers, circular decision engine, and cloud integrations for the **ScrapSetu** platform.

## Planned Architecture & Responsibilities

The backend subsystem is designed to handle:

- **API & Validation Layer**: High-performance RESTful and asynchronous endpoints using **FastAPI** and **Pydantic** data contracts.
- **Circular Decision Engine**: Deterministic safety rules, multi-tier circular pathway determination (reuse, refurbish, component recovery, recycling), and real-time commodity arbitrage calculation.
- **Multimodal AI & ML Orchestration**: Integration with **Amazon Bedrock** (for multimodal inference and reasoning) and **Amazon SageMaker** (for custom computer vision and tabular model training/hosting).
- **Spatial & Relational Data Management**: **PostgreSQL** with **PostGIS** extension for geospatial recycler queries, digital waste lot lineage, and transaction records.
- **IoT Smart-Bin Telemetry**: Ingestion of telemetry from ESP32-based smart bins via **AWS IoT Core** over MQTT, triggering dynamic route optimization (Capacitated Vehicle Routing Problem - CVRP).
- **Event-Driven Architecture**: Asynchronous background jobs and decoupled messaging via **Amazon SQS** and **Amazon EventBridge**.
- **Observability & Storage**: Structured telemetry and metrics on **Amazon CloudWatch**, with image and artifact persistence in **Amazon S3**.

## Development & Isolation Rules

- **Directory Isolation**: All Python source code, package manifests, virtual environments, migration scripts, and backend-specific configurations must reside exclusively within `backend/`.
- **Implementation Status**: This directory is currently in the **initial scaffolding** state. Application code, virtual environments, and dependencies will be introduced during implementation tasks.
