# ScrapSetu Documentation

This directory serves as the centralized repository for all architecture specifications, API contracts, research findings, cloud deployment plans, and technical decision records for **ScrapSetu — AI-Powered Circular Economy & Resource Intelligence Platform**.

## Documentation Structure

| Directory | Purpose |
| :--- | :--- |
| [`architecture/`](./architecture/) | High-level system architecture, component interaction diagrams, data flows, and subsystem boundary definitions. |
| [`api/`](./api/) | API contracts, OpenAPI/Swagger specifications, REST/WebSocket endpoint definitions, and request/response schemas. |
| [`research/`](./research/) | Multimodal ML models, waste classification experiments, dataset documentation, evaluation metrics, and performance benchmarks. |
| [`aws/`](./aws/) | Cloud infrastructure architecture, AWS service mapping (Bedrock, SageMaker, IoT Core, S3, RDS/PostGIS), security controls, IAM policies, and cost modeling. |
| [`setup/`](./setup/) | Step-by-step local development setup guides, prerequisite tool installations, environment configuration, and troubleshooting steps. |
| [`decisions/`](./decisions/) | Architecture Decision Records (ADRs) capturing architectural choices, technical trade-offs, and design rationale. |

## Documentation Guidelines

- **Accuracy & Source of Truth**: Documentation should reflect current implementations or verified architecture designs.
- **Incremental Population**: Directories remain lightweight during scaffolding and are populated systematically during their respective implementation phases.
- **Decision Records**: Use the `decisions/` directory for any significant architectural choices or protocol changes using standard ADR format.
