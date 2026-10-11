# ScrapSetu — Waste and Energy

A hackathon pilot connecting collectors, vendors and recyclers through recorded material lots, transparent offers, two-party handovers and measured recovery. The current app uses the authenticated `/api/v2` workflow. Older in-memory mutation routers are no longer mounted.

**Local interface:** http://127.0.0.1:5173 · **API documentation:** http://127.0.0.1:8001/docs

## Implemented

- Validated Bedrock image triage with explicit demo samples, hazard overrides, manual review and honest unavailable/error states.
- Local signed sessions or Cognito PKCE/role authentication; persistent SQLite or transactional DynamoDB ledger.
- Private evidence, measured weights, disclosed fees, receiver deductions, sender acceptance, expiring receiver-bound QR tokens and replay protection.
- Buyer payment reports and seller acknowledgements, earnings, JSON receipts, disputes and documented administrator resolution.
- Facility permit review/expiry, material/quantity matching, indicative sourced prices, price-deviation signals and pickups.
- Source-lot allocations, actual history, mass-balanced recovery and factor-versioned energy estimates; separate demo totals.
- Mobile interface, English/Hindi safety audio, installable shell, durable offline draft queue and idempotent synchronization.
- Simulated/IoT bin telemetry and capacity-constrained route heuristic using straight-line estimates or Amazon Location road matrices.
- SAM infrastructure for AWS hosting, identity, storage, AI permissions, IoT, monitoring and budget alerts.

## Run and configure

See [environment setup](docs/setup/environment.md) for exact `.env` values, account credentials, startup commands and the full test journey. Copy the root `.env.example` to **backend/.env** only when it does not already exist. Frontend values go in **frontend/.env** and must never contain secrets.

The default local accounts are `collector_demo`, `vendor_demo`, `recycler_demo`, `admin_demo`; password `scrapsetu-local`. All local accounts/facilities are demonstration fixtures. Real uploaded-photo inference needs AWS credentials/model access; explicit samples work without AWS.

## Verification

```sh
backend/.venv/bin/python -m pytest backend/tests -q
npm test --prefix frontend
npm run build --prefix frontend
# With API and production preview running:
cd frontend
npx playwright test
```

Cloud deployment instructions are in [infrastructure/README.md](infrastructure/README.md). Deployment resources are implemented but have not been provisioned or verified live. See [implementation status and original critical review](PROJECT_REVIEW_AND_AWS_ROADMAP.md).

## Limits that matter

This is a pilot, not certified waste-processing infrastructure. Administrator permit review does not query an official registry. Reference rates require actual sources; no live market feed is configured. Image classification does not certify purity or weight. Payments are acknowledged by the parties, not executed or independently bank-verified. Receipts are internal records, not EPR certificates. Energy estimates need documented factors; missing factors produce no invented savings. Route planning is a capacity-constrained heuristic, not proof of optimality. Local tests are not evidence that AWS integrations have run successfully.
