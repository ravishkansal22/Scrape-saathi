# ScrapSetu: project review and AWS hackathon roadmap

Reviewed 11 October 2026 (India time). Repository: `Scrape-saathi`. Original baseline: `25da1e7`; re-evaluated against `63acb3f`, including the Bedrock implementation in `398ed0d`.

The original review and re-evaluation changed only this report. The subsequent confirmed first-phase implementation is recorded below. “Online round” is interpreted as the current hackathon submission stage; no judging rubric, deadline, AWS account access, or deployed URL was provided. The track is interpreted as **Waste and Energy**. The unclear sentence about sleep is not treated as an additional feature requirement.

## Current implementation checkpoint — all planned application phases

The latest instruction authorizes all phases locally without a Git push. The authenticated persistent workflow now replaces the old demo application. No commits, pushes or AWS provisioning have been performed. **Application implementation is present across phases; cloud acceptance criteria are still pending actual deployment and credentials.**

| Phase | Implemented locally | Validation / remaining work |
|---|---|---|
| 1: AI truthfulness and safety | Strict image/model validation, real Bedrock Converse, explicit demo provenance, hazard escalation and no confident fallback | Inference boundary tests pass with mocked AWS. Real model invocation and qualified safety-content review remain |
| 2: Traceability and arithmetic | Persistent records, original/receiver weights, deductions, explicit sender acceptance, payment acknowledgement, real events/receipts, atomic source allocations | Tested end-to-end API flow, replay/conflict rejection, recovery conservation. No bank integration or official EPR certification |
| 3: Foundation and AWS | Local JWT/Cognito roles, SQLite/DynamoDB, private local/S3 evidence, Lambda adapter, SAM infrastructure including hosting and monitoring | Local role/storage tests and CloudFormation lint pass. Stack deployment, permissions and regional live-service checks remain |
| 4: Collector usefulness | Dedicated mobile flow, material/price board, earnings, buyer matching, facility review, pickups, English/Hindi audio with Polly/device fallback | Browser journey and mobile layout checked. Main forms remain English; field accessibility testing and real permit/price data remain |
| 5: Offline and impact | Precaching service worker, account-isolated IndexedDB queue, durable operation IDs, recovery evidence/mass balance, immutable factor snapshots, separate demo totals | Offline reload/reconnect and retry tests; no invented energy factors. Real scientific factors and measured operational evidence remain |
| 6: Fleet extension | IoT ingestion rule/software simulator, stale-reading rejection, fill threshold, compatible-material capacity-constrained trips, optional Location road matrix | Local simulator/route tested. Real IoT/Location round trip and physical devices remain unverified; route is a heuristic |

Current setup and exact environment values: [environment guide](docs/setup/environment.md). Cloud deployment: [infrastructure guide](infrastructure/README.md). The API now serves `/api/v2`; former in-memory mutation APIs are unmounted. Local demo users and facilities are clearly labeled. Evidence and state persist in ignored `backend/data/`.

**Current verification:** 68 backend tests, 8 frontend component/offline-queue tests, production TypeScript/Vite build and CloudFormation template lint. Both browser tests passed: offline shell reload/sync and the cross-role handover/payment flow. No mocked test is described as a live AWS result.

**Critical remaining work:** deploy and verify with your AWS account; enter genuine permit/market/factor sources; review safety guidance with specialists; test low-literacy users and basic Android devices. The DynamoDB adapter is a serialized single-partition pilot, not a scalable production design. There is no automated permit registry integration, payment gateway, full UI translation, token refresh, downstream financial arbitration, or scientific validation of user-entered factors. Offline drafts require a previously loaded app and signed-in cached session. Do not pitch those limits as completed production capabilities.

The earlier findings below are retained as a historical review, not the current implementation status.

## Historical checkpoint — phase 1 completed locally

Following confirmation, implemented the recommended first approval scope: harden the existing Nova integration and its collector flow. All changes remain local; nothing was committed, pushed, provisioned, or deployed.

- Replaced the motor fallback with distinct invalid-input (422), unavailable-provider (503), and invalid-model-output (502) responses. Explicit demo samples are separate and labeled.
- Kept one Converse invocation path with bounded SDK retries and timeouts; removed the invalid provider-specific fallback. AWS client initialization is lazy.
- Added decoded-image validation, format detection, byte/dimension limits, animation rejection, and strict model-result validation. No assumed confidence or missing hazard defaults for model output. Validation errors do not echo uploaded content.
- Combined collector-reported and detected hazards; hazardous/unknown/mixed/medium-confidence/low-confidence/empty-material results require qualified review. Guidance no longer gives a universal containment prescription. Demo clarification records an observation without certifying purity.
- Added model/source/request/latency metadata; fixed photo reruns and stale-result clearing; added visible error and hazard reporting controls. The collector UI blocks review-required handovers and defers live-image valuation pending material/unit mapping.
- Restored `.env.example`, updated setup and AI documentation, removed unconditional Claude-active labels and fabricated confidence-derived CPCB codes from the collector screen, and added reproducible test commands.

**Validation:** 60 backend tests passed, including the existing API tests and 53 new inference/input/hazard regression cases. Five frontend component tests passed. TypeScript and Vite production build passed. Lint completed with React-hook warnings in existing component patterns; the build reported a bundle-size warning. Backend tests emitted the existing Pydantic class-config deprecation warning. No live Bedrock smoke test was performed: mocked tests do not prove AWS credentials, model access, or region availability. The test environment used Python 3.9.6; the setup guide recommends Python 3.11+.

**Remaining:** phases 2–6 below are not implemented by this checkpoint. Existing in-memory transactions, unauthenticated handover APIs, synthetic traceability, loose pricing/unit mapping, and missing cloud/offline/energy features remain open. UI review gating is not authenticated server-side custody enforcement. Safety content still needs qualified domain review. The next implementation phase is truthful records and transaction arithmetic.

## Re-evaluation after the Bedrock changes — historical planning baseline

This section records the pre-implementation comparison at `63acb3f`. Its phase-1 findings are addressed by the checkpoint above; later-phase findings remain open. The revised order below supersedes the earlier delivery sequence where it is more specific.

### What changed

Exactly three tracked files changed since the original baseline: `backend/app/services/ai_triage.py` now invokes Bedrock, `backend/app/config.py` defaults to `amazon.nova-lite-v1:0`, and the root `.env.example` was deleted. The frontend, schemas, tests, transaction services, persistence, and infrastructure did not change.

The vision function is **no longer a placeholder**. It now decodes base64 images, calls `converse()`, attempts a provider-specific `invoke_model()` fallback, parses JSON, assigns confidence tiers, builds material/hazard fields, and selects segregation guidance. This is meaningful implementation progress. It is **implemented but not live-verified in this review**; account access, region/model availability, deployed operation, and model accuracy remain unproven.

### Findings that change the implementation plan

| Priority | Current evidence | Required next action |
|---|---|---|
| P0 | `analyze_scrap()` still returns the electric-motor preset after inference errors or an unavailable client | Replace live-path fallback with explicit unavailable/unknown results. Keep presets behind an explicit demo input/mode. |
| P0 | Lines 437–468 combine some hazard flags, but category and segregation remain driven by the original category; `category=hazardous` alone does not force manual review | Enforce a consistent hazard decision before storage, pathway, and transaction eligibility are selected. Unknown categories must also require review even with high claimed confidence. |
| P0 | A single containment instruction is attached to all `is_hazardous` results, while chemical/pressure flags alone may produce no containment instruction | Use reviewed, hazard-specific guidance; do not treat one instruction or model-generated guidance as universally appropriate. Route uncertain cases to review. |
| P1 | Nova fallback uses `inferenceConfig.max_new_tokens` at line 369 | Align it with the documented `maxTokens` schema, or remove the fallback and keep one supported invocation path. Actual AWS handling of this mismatched field was not tested. |
| P1 | JSON fields are read with permissive defaults and Python `bool()` conversions | Validate the model output with a strict internal schema: `bool("false")` is true, omitted flags currently default false, and omitted confidence becomes 0.75. Reject incomplete/malformed results rather than inventing usable certainty. |
| P1 | Prompt and parser omit `exposed_wiring` and `sharp_edges`, although the response schema includes them | Cover intended hazard markers consistently; keep collector-reported hazards alongside model findings. |
| P1 | Confidence-tier calculation does not create clarification prompts for medium-confidence live outputs | Add an explicit review/clarification path; do not reuse the copper-specific clarification method for arbitrary images or clear existing hazards. |
| P1 | First response content block is assumed to contain text; stop reason is ignored; all Converse exceptions trigger another inference attempt | Extract text robustly, handle truncation and malformed responses, classify errors, and bound retries/timeouts. Do not retry authorization or invalid-input failures via a second API. |
| P1 | Image format comes from a data-URL header or defaults to JPEG; there is no decoded-image verification or size/dimension gate | Validate actual image content and limits before inference; compress supported large images and reject invalid/unsupported input with a useful response. |
| P1 | `image_url` remains accepted in the request schema, but the vision method requires `image_base64` | Explicitly reject unsupported URL input for the first version, or implement a controlled supported source. URL-only requests must not fall through to the motor preset. |
| P1 | Upload triggers live analysis, but the existing “Run Material Assay” button still submits `selectedPreset` | Make the displayed image, selected source, and rerun action agree; clearly identify demo versus uploaded-image results. |
| P1 | `.env.example` was deleted; README/setup guidance and frontend labels still refer to Claude 3.5 | Restore a safe configuration template and align setup/status text with configured and observed behavior. An “active” label must not be unconditional. |

The Nova request documentation uses `maxTokens`; the Converse documentation also specifies image restrictions. These checks inform the proposed fix, rather than proving this checkout's integration works. [Amazon Nova request schema](https://docs.aws.amazon.com/nova/latest/userguide/complete-request-schema.html), [Bedrock Converse image limits](https://docs.aws.amazon.com/cli/latest/reference/bedrock-runtime/converse.html).

### Revised implementation sequence

1. **Harden and verify the existing Nova integration.** Keep the new implementation; avoid a model/provider rewrite. Add strict request/model-response validation, explicit failure states, consistent hazard review, bounded error handling, correct upload/rerun behavior, configuration documentation, and focused tests. Record source/model/request ID where available. Acceptance: a fresh image can produce a validated result, and missing credentials, denied access, timeout, invalid image, malformed JSON, unknown category, and conflicting hazard fields never produce a false verified preset. Mocked tests precede an account-authorized live smoke test.
2. **Restore truthful records and correct transaction arithmetic.** Remove synthetic traceability and unknown-lot substitution; fix recycler deduction field mismatch, material/unit mapping, original-weight preservation, dispute/payment consistency, and invalid state transitions. Acceptance: a newly created lot has no invented recycling events; 10 kg minus 1 kg at ₹100/kg yields ₹900; an unsupported quote remains unavailable.
3. **Add durable data and authenticated custody together.** Proceed with the proposed DynamoDB/Cognito approach unless changed at confirmation. Define lot/event/transaction access patterns, actor authorization, conditional writes, replay/idempotency rules, inventory allocation, and private S3 evidence access. Acceptance: restart retains data; wrong recipients and repeated/conflicting handovers cannot alter custody twice. API roles do not substitute for permit verification.
4. **Deploy the complete journey on AWS.** Configure Amplify, API Gateway/Lambda integration, IAM, deployment secrets, HTTPS API origin, CloudWatch, and cost alerts. Reuse the hardened Bedrock call; this phase integrates it into the deployed journey rather than implements it from scratch. Acceptance: a new image becomes a persistent lot and a legitimate handover/receipt; no step depends on the visitor's localhost.
5. **Improve collector access and resilience.** Build the simpler collector interface, reviewed Hindi audio through Polly, earnings/pending-payment view, then IndexedDB capture and idempotent reconnect sync. Acceptance: a draft survives app closure offline and reaches the server exactly once on reconnect.
6. **Add defensible track impact and optional extensions.** First measure recovery and disclose energy-estimate factors. Add grouped pickups, Location road-distance/routing, or IoT telemetry only after the core journey works. Keep simulated telemetry and estimated savings visibly labeled.

**Recommended first approval scope (now implemented locally):** phase 1 only, followed by a tested checkpoint before the broader data/auth/deployment work. This closes the new integration's most immediate risks without discarding the team's work. The other phases remain the proposed roadmap.

### What remains unchanged from the original review

The in-memory ledger, synthetic traceability, unauthenticated actor IDs, QR replay/ownership issues, recycler deduction mismatch, seeded prices/permits, lost aggregation lineage, missing offline sync/audio, hardcoded frontend API URL, and simulated municipal routing remain open. No new commit addresses those files. All corresponding sections below remain applicable.

### Verification in this re-evaluation

Compared the complete diff from `25da1e7` to `63acb3f`, read the new inference path alongside request/response schemas and frontend upload behavior, and parsed both changed Python files successfully with Python's AST parser. This checks syntax only. `python3 -m pytest --version` still fails because `pytest` is not installed; no new tests were added by the upstream changes. No dependencies were installed and no live AWS requests, infrastructure changes, application edits, or deployments were performed.

## 1. Read this first

**The idea is worthwhile, and the repository contains a substantial interactive prototype. It does not yet support the README's claims of a live AI-powered, immutable, verified, enterprise-grade platform.** The biggest opportunity is to make one collector-to-recycler journey demonstrably trustworthy.

The strongest proposition is:

> ScrapSetu helps informal collectors identify materials, understand indicative prices, find suitable verified recycling partners, and retain evidence of each handover—even when connectivity is unreliable. It measures recovered materials and estimates the associated energy benefit using disclosed assumptions.

Prioritize these five outcomes:

1. A real uploaded image reaches Amazon Bedrock; unknown or failed results remain unknown.
2. A collector creates a lot that survives a backend restart.
3. Identified parties confirm measured quantities, deductions, and handover without fabricated history.
4. A simple mobile collector screen provides Hindi audio, a price explanation, and a receipt.
5. An impact panel distinguishes collected, handed-over, and actually recovered material, with a transparent energy estimate.

AWS breadth should follow this working journey. A diagram containing many AWS logos is weaker evidence than a few integrated services with visible inputs, outputs, logs, and failure handling.

## 2. What the project currently is

The React/TypeScript/Vite frontend contains five workspaces: collector, vendor, recycler, traceability, and municipal fleet. FastAPI exposes triage, pricing, lot/QR, transaction, vendor, and recycler APIs. Pydantic defines the domain contracts. Services operate primarily on seeded Python dictionaries.

The existing scope is broader than the original collector/recycler idea: it also includes vendor warehouses, general waste segregation, municipal smart bins, routing, and recovery reporting. This breadth provides a good visual demo, but stretches beyond the central problem of collector access, fair transactions, and reliable custody records.

The repository folder uses “Scrape-saathi”; the application uses “ScrapSetu.” Choose one public name for the submission, screenshots, and pitch.

## 3. What has been done—and what has not

“Implemented prototype” below means executable source exists. It does not mean production readiness or runtime verification in this review.

| Capability | Evidence in the repository | Assessment and remaining work |
|---|---|---|
| Five portal screens | `frontend/src/App.tsx`, `frontend/src/components/*View.tsx` | Implemented UI and API wiring. Role tabs are not access control. Collector usability needs separate attention. |
| Image upload | `CollectorView.tsx` reads a file and sends base64 | Upload-to-API path and Bedrock image invocation now exist. Persistent evidence storage, input validation, and consistent rerun behavior remain missing. |
| Waste classification | `backend/app/services/ai_triage.py` | Five presets plus Bedrock Converse/provider-specific fallback, seven-category mapping, and hazard fields. Implemented but not live-verified; error fallback and safety consistency remain blockers. |
| Clarification | `apply_clarification()` | Rule-based copper answer handling exists. User choice automatically becomes high confidence and clears hazards; this is not verified material assay. |
| Reference prices | `backend/app/services/pricing.py` | Eight seeded prices and valuation arithmetic. No market-feed ingestion; seeded records nevertheless say `is_live_verified=True`. |
| Measured-weight valuation | Pricing service and collector form | Uses entered weight/count rather than AI-estimated weight. No physical-scale integration or proof of calibration. Material identity/unit mapping needs correction. |
| Digital lots and QR | `backend/app/services/handover.py` | Lot creation, HMAC signing, expiry checks, and QR rendering exist. Persistence, ownership validation, replay prevention, and a real verification page are missing. |
| Transaction ledger | `backend/app/services/transactions.py` | Offers, receipt confirmation, discrepancies, payment-status updates, and disputes exist in memory. No authenticated dual acceptance, durable audit ledger, or payment provider integration. |
| Vendor operations | `backend/app/services/vendor.py` | Seeded inventory dashboard, inspections, onward lot creation. No complete inventory reconciliation or parent-to-child lot allocation. |
| Recycler discovery | `backend/app/services/recyclers.py` | Four seeded facilities, category matching, Haversine straight-line distance. No PostGIS queries, permit verification workflow, or road-distance calculation. |
| Recycler intake/outcomes | Recycler service and portal | Forms and API records exist. Outcomes are self-reported; recovery percentages are supplied by clients. Hash strings are not official certificates. |
| Traceability | Recycler graph service and traceability UI | Timeline construction exists, but can substitute a different lot and insert invented downstream events. Not trustworthy end-to-end provenance yet. |
| Municipal fleet | Municipal UI and `frontend/src/services/api.ts` | Frontend fallback bin telemetry and route display. `/fleet/*` calls have no corresponding backend router in this checkout. No real IoT ingestion or capacity-constrained solver. |
| Safety awareness | Preset hazard fields and guidance | Text prototype. No dedicated reviewed pictorial/audio library for batteries, CRTs, and PCBs; no evaluation of unseen hazardous images. |
| Earnings | Transaction totals and payment fields | Partial ledger foundation. Missing a collector-specific daily history, pending dues, receipts, and clear cash-versus-confirmed-payment status. |
| Offline-first use | No service worker, IndexedDB queue, or synchronization implementation found | Not implemented. Mock fallback data is not offline transaction capture. |
| Recycler business controls | Matching/intake/outcome APIs | Accepted-material editing, offered-rate management, pickup requests, and authorization-document lifecycle remain missing. |
| Suspicious-price detection | No detector found | Proposed feature only. Start with transparent comparison rules. |
| AWS infrastructure | Boto3 initialization and Bedrock invocation code | Bedrock integration now exists in source. No implemented S3 upload, Cognito enforcement, IoT pipeline, or infrastructure-as-code found. Root `.env.example` was deleted in the update. |
| Tests | `backend/tests/test_api.py` | Seven test functions cover sample happy paths. No proof of live Bedrock, persistence, authorization, offline sync, or municipal routing. |

## 4. Critical findings, ranked by impact

### P0: Uploaded images can receive a confident, unrelated answer

The vision method now makes actual Bedrock calls. However, `analyze_scrap()` still falls through to a high-confidence electric motor if image inference fails or is unavailable. URL-only image requests also remain unsupported by the vision method. An arbitrary battery or unknown object could therefore receive the motor preset's answer on those paths. This finding is now about failure handling, not an absent model invocation.

**Required behavior:** return an explicit unavailable/unknown state when inference fails, preserve reported hazards, and require manual review when uncertain. Separate demo presets from live inference and label both. Do not present model confidence as calibrated accuracy or photo classification as proof of composition/purity.

### P0: Traceability invents evidence

`recyclers.py:get_traceability_graph()` uses the first available lot when the requested lot is absent. When no transactions exist, it adds mock vendor/recycler nodes, a 96.5% recovery outcome, and an audit hash. A new collection can appear to have already been recycled.

**Required behavior:** unknown ID returns 404; a new lot shows only collection; each later event requires a recorded action. Demo history must be visibly isolated. Do not count synthetic events in impact totals.

### P0: Identity and custody are not enforced

APIs accept actor IDs from request bodies. Receipt confirmation does not establish that the caller is the intended receiver. Transaction creation marks both parties verified without a verification workflow. The recycler portal loads all transactions and defaults to the first, including transactions addressed to vendors.

**Required behavior:** derive identity from authentication; check role, ownership, intended recipient, material permission, and legal state transition on the server. Add sender acceptance of changed weights/deductions before final settlement. Authentication alone does not establish recycler authorization.

### P0: The ledger is temporary

Lots, transactions, vendor inventory, and recycler outcomes use process memory. Restarting loses newly created records; multiple workers would have separate states. Lists called “immutable audit logs” remain mutable application objects.

**Required behavior:** durable storage, atomic custody changes, immutable original measurements, versioned events, and idempotent operations. A hash detects some content changes only when the trusted reference is retained; it does not prove physical receipt or official approval.

### P1: A concrete recycler deduction bug changes payout

`recyclers.py:confirm_intake()` passes `contamination_deduction_kg`; `transactions.py:confirm_receipt()` calculates payment using `contamination_weight_deduction_kg`. Both schema fields exist, so validation does not expose the mismatch. The calculation can ignore the recycler's deduction.

**Acceptance example:** 10 kg received, 1 kg agreed deduction, and ₹100/kg must produce 9 kg payable and ₹900, with both weights retained. Reject negative deductions and deductions larger than received weight. Do not apply a deduction silently or without agreement.

### P1: Pricing identity and units are too loose

The collector sends a triage component name and a category such as `recyclable`, while the catalogue uses commercial names and categories such as `Non-Ferrous Metals`. Unmatched requests fall back to ₹40. Whole-object weight can also be multiplied by a component's unit rate without a measured component quantity. Per-kg rates can be reused for item counts.

**Required behavior:** stable material/grade IDs, explicit units, assembly-specific pricing or measured component weights, and no invented default quote. Keep reference range, buyer offer, transport cost, deduction, and final settlement distinct. Record source and true observation time; import-time timestamps are not price freshness.

### P1: Recycler matching is broader than its claim

In `match_recyclers()`, `or category == WasteCategory.RECYCLABLE` admits every registry entry for a recyclable query, even one that does not list that category. Authorization is represented by seeded labels with no expiry check.

**Required behavior:** filter by verified accepted material and permit scope before ranking. Show evidence source, review date, expiry, operational capacity, minimum lot size, and pickup availability. Distance should be clearly identified as straight-line or road distance.

### P1: Aggregation breaks provenance and mass balance

Onward bulk lots have no allocations to source lots and do not debit inventory. Vendor inspection replaces the lot weight and uses vendor-measured effective weight as the transaction sender weight, weakening the original comparison. Recovery weight and percentage are independently accepted, and outcomes can overwrite earlier records for a transaction.

**Required behavior:** preserve original measurements; model split/merge allocations; prevent allocating the same mass twice; compute yield from accepted input and recovered output; record residue/loss; correct outcomes with new events rather than silent replacement.

### P1: QR and settlement labels overstate guarantees

The QR implementation uses a repository default signing secret, includes a nonce without tracking consumption, and builds a verification URL containing only the first 16 token characters. No matching verification UI is present. Payment updates simply set user-provided status/amount; there is no UPI settlement or escrow integration. The dispute method logs a new payment status of `DISPUTED` without changing the transaction's payment-status field.

**Required behavior:** a deployment secret, ownership checks, atomic one-time redemption, functioning verification links, and payment-status invariants. Call manual entries “payment reported” until independently confirmed. Preserve the distinction between handover complete and payment complete.

### P1: Deployment and municipal claims need correction

The API URL is fixed to `http://localhost:8000`; on a deployed site this targets the visitor's computer. Debug CORS permits all origins. The fallback route has a fixed 18.4 km result, synthetic segment distances, and does not enforce its supplied vehicle capacity. Connecting waypoint coordinates is not a verified road route or CVRP solution.

**Required behavior:** configurable HTTPS API base URL, restricted deployment origins, explicit demo labels, and either working fleet APIs or a clearly deferred fleet feature.

## 5. Is this a good idea for the track?

**Waste fit is strong. Energy fit needs a measurable connection.** Material recovery, diversion to appropriate recyclers, and safer collection directly support waste management. The current EV label and route graphic do not demonstrate energy savings.

The defensible differentiator is the combination of collector accessibility, transparent offers, and evidence-backed handovers. Classification, a map, and a price board are individually easy to copy. The difficult and valuable part is building trusted records that collectors and recyclers will actually use.

The main adoption risks are operational:

- Collectors may already have buyers offering immediate cash, credit, and pickup. A new platform must improve net earnings or reliability enough to justify another workflow.
- “Fair price” varies with grade, moisture, contamination, quantity, location, transport, and payment delay. Publish a sourced range and comparable net offers, not a universal “true price.”
- Authorized recyclers may refuse small loads. Keep aggregators as legitimate consolidation partners and explain their fees.
- A dense English dashboard is a poor starting point for low-literacy users on basic Android phones. Keep it for operators; give collectors a separate task-focused flow.
- A marketplace with no nearby participating buyer has little practical value. Start with one locality, two or three partners, and a narrow material catalogue.
- A photograph cannot establish hidden battery condition, chemical identity, or alloy purity. Human inspection remains part of the product.

Validate the idea with a small pilot: observe collectors recording a sale, ask recyclers about minimum loads and rejected materials, and compare net proceeds/time against existing practice. Suggested research targets are 5–10 collectors and 2–3 recycler/aggregator interviews; these are proposed activities, not completed evidence.

## 6. Recommended online-round scope

Build one reliable journey using a narrow set of common materials, plus a hazardous-item escalation example:

1. Collector selects language and takes a photo.
2. The system suggests material/category, explains uncertainty, and gives approved safety guidance.
3. Collector enters actual scale weight and sees a sourced indicative range.
4. Eligible buyers show net offer, distance, minimum quantity, and pickup options.
5. Collector selects a buyer; a persistent lot and pending handover are created.
6. Receiver scans the QR, records their measurement, and proposes deductions.
7. Collector accepts or disputes the final amount. Both can retrieve a receipt.
8. Recycler separately records evidence of recovery; the impact panel updates only then.

For the online submission, retain municipal fleet as an optional extension unless the judging brief explicitly requires it. Complete one real round trip before expanding to more dashboards. Clearly label prototype, simulated, and live features in the submission.

## 7. AWS architecture with a reason for each service

Recommended target: **Amplify Hosting → Cognito-authenticated API Gateway → Lambda-hosted FastAPI → DynamoDB**, with S3 evidence, Bedrock inference, and cached Polly audio. This is a proposed architecture, not the current deployment. FastAPI needs an ASGI-to-Lambda integration or compatible web adapter; copying the application into Lambda is not sufficient. Durable storage must be implemented before scaling out execution.

| Service | Concrete purpose | Priority | Evidence to show judges |
|---|---|---|---|
| AWS Amplify Hosting | Deploy the existing React SPA over HTTPS | Core | Public working URL, successful deployment, configured API origin |
| Amazon API Gateway + AWS Lambda | Authenticated API and application execution | Core | Real request completes the collection/handover journey; failure produces a useful error |
| Amazon Cognito | User identity and role claims | Core | Collector cannot mutate another collector's lot; only intended receiver can confirm |
| Amazon DynamoDB | Lots, transactions, custody events, sync-operation records | Core | Restart/reload preserves data; conditional write prevents duplicate custody transfer |
| Amazon S3 | Private photos, scale evidence, generated receipts, approved audio | Core | Short-lived upload/download link, stored object linked to lot, denied cross-user access |
| Amazon Bedrock | Image-assisted material triage and structured suggestions | Core | A new image invokes an available image-capable model; request ID, latency, validated result, and honest failure path |
| Amazon Polly | Hindi/English spoken guidance and receipt summaries | Differentiator | Collector hears a reviewed prompt; cached standard audio also plays offline |
| Amazon CloudWatch | API/inference/sync errors and latency metrics | Core support | Trace a failed operation to a useful, redacted log; demonstrate an alarm configuration |
| AWS IAM + Secrets Manager | Least-privilege service roles and QR secret management | Core support | No browser AWS keys; scoped resource permissions; no fallback signing secret in deployment |
| AWS Budgets | Cost visibility and alerts | Core support | Budget and alert configured; alert is not advertised as a hard spending cap |
| Amazon SQS | Deferred photo analysis or receipt generation, retries, dead-letter handling | Next | One job survives a temporary failure without duplicate effects |
| AWS IoT Core | Authentic smart-bin telemetry, only if fleet demo is retained | Optional | A device or explicitly labeled software simulator publishes a message through AWS into stored state |
| Amazon Location Service | Real road distances and route matrix for matching/pickups | Optional | Same endpoints and demand yield a reproducible route comparison |

Use DynamoDB transactions/conditional writes for custody and inventory invariants; plan access patterns before choosing keys. Alternatively, choose RDS PostgreSQL if the team is substantially faster with relational transactions and lot genealogy. **Choose one primary database for this round.** Do not add both just to expand the service count.

Polly supports Hindi, but language, voice, engine, and region combinations must be checked. Generate common reviewed prompts once and cache them; cloud synthesis is not available while disconnected. [AWS Polly languages](https://docs.aws.amazon.com/en_en/polly/latest/dg/supported-languages.html), [bilingual voices](https://docs.aws.amazon.com/en_en/polly/latest/dg/bilingual-voices.html).

The new default is `amazon.nova-lite-v1:0`. Verify access and image support for the configured model in the actual account/region, record the selected model, and evaluate representative images. The README/setup/frontend Claude labels are now stale. [Bedrock model availability](https://docs.aws.amazon.com/en_us/bedrock/latest/userguide/models.html), [Converse image inference](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html).

Relevant implementation references: [Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html), [Cognito and API authorization](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-accessing-resources-api-gateway-and-lambda.html), [DynamoDB conditional expressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html), [S3 presigned access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html), [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-best-practices.html).

SQS standard queues can redeliver messages; handlers must be idempotent. A queue in AWS does not store work on an offline phone. IoT Core routes telemetry to other services; it does not solve vehicle routing. Amazon Location supplies road travel data; a capacity-aware optimization layer still needs to enforce the application's constraints. [SQS delivery semantics](https://docs.aws.amazon.com/en_en/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-types.html), [IoT rules](https://docs.aws.amazon.com/iot/latest/developerguide/iot-rules-tutorial.html), [Location route matrix](https://docs.aws.amazon.com/location/latest/APIReference/API_CalculateRouteMatrix.html).

Defer SageMaker training, a general chatbot, blockchain, a data lake, and additional workflow services until a demonstrated requirement justifies them. No spending estimate is asserted here: calculate one after choosing region, model, request volume, image size, and retention. Limit inference retries, compress images, set retention policies, and avoid repeated model calls for unchanged input.

## 8. Features worth adding, in priority order

| Feature | Value | Minimum useful implementation |
|---|---|---|
| Collector mode | Addresses the original digital-access problem | Large pictorial actions: identify, price, sell, earnings; Hindi audio; simple numeric keypad |
| Evidence-backed digital receipt | Immediate trust and dispute value | Both weights, grade, rate, deductions, parties, payment status, timestamp, and reference ID |
| Recycler verification workflow | Makes “authorized” meaningful | Permit source/document, accepted materials, expiry, reviewer, last check, suspended status |
| Offer comparison | Improves price transparency | Net proceeds after fees/transport, quote validity, grade/quantity conditions |
| Collector earnings book | Encourages repeated use | Daily totals, pending payments, cash receipts, dispute status, shareable receipt |
| Pickup requests and grouped loads | Solves small-lot access | Request/accept/time window/status; consolidate compatible materials while retaining origin allocations |
| Offline capture and synchronization | Makes the app usable under weak connectivity | Local drafts, retry queue, visible pending status, explicit conflict resolution |
| Price anomaly explanations | Supports bargaining | Compare same material/grade/locality/unit against a sufficiently recent reference range; say “unusual,” not “fraud” |
| Lot genealogy and mass balance | Makes aggregation traceable | Parent allocations, remaining quantity, residue, recovery records, duplicate-allocation rejection |
| Impact and energy panel | Strengthens track relevance | Verified handover/recovery totals and sourced, versioned energy estimates |
| Human review queue | Handles uncertainty responsibly | Unknown image/hazard/permit or disputed quantity routed to an identified reviewer |

Suspicious-price detection does not need ML initially. Use clear rules with freshness and sample-count checks. Later, train/evaluate anomaly models only after collecting enough representative, permissioned transaction data. Avoid generating a precise “market value” from an LLM.

## 9. Offline-first design that actually works

Use an installable PWA with a service worker for the app shell and reviewed static guidance, plus IndexedDB for drafts, images, and a durable operation queue. Save locally before attempting an upload. Cloud AI should show “analysis pending” offline; never replace it with a confident preset.

Each operation needs a client-generated unique ID, lot ID, expected record version, local timestamp, payload, and sync status. On reconnect, authenticate, upload evidence, send operations in dependency order, and retain local data until the server acknowledges it. Use both foreground retry and supported background facilities; do not depend solely on background sync.

Server rules must deduplicate retries and reject conflicting custody claims. Offline records are provisional: two devices cannot both finalize the same handover. The current two-hour QR expiry needs a defined reconnect/reissue policy, without embedding a server signing secret on the device. Keep cached prices timestamped and visibly stale.

Acceptance demo: create a lot in airplane mode, close/reopen the app, reconnect, and verify exactly one server lot. Retry the same operation and verify no duplicate. Attempt conflicting receiver updates and show a resolvable conflict.

## 10. Make Waste and Energy impact defensible

Display separate quantities: collected kg, receiver-confirmed kg, recovered-output kg, and residue. Count a physical quantity once even if it passes through collector, vendor, and recycler. Receiving waste is not proof that it was recycled.

For an estimated material energy benefit, use compatible published lifecycle boundaries:

`estimated energy avoided (kWh) = sum(recovered material kg × (virgin-production kWh/kg − secondary-production kWh/kg)) − additional energy outside those factors`

Store material, geography, factor source, publication year, system boundary, factor version, and uncertainty. Subtract additional transport/processing only if it is not already included in the factors. Do not apply a pure-copper factor to the whole weight of a mixed motor. If suitable factors are unavailable, show recovered kg and leave energy unestimated.

For routing, compare the same stops, payload, depot return, vehicle, and service constraints. Report baseline km versus optimized km, then estimate energy from an explicit vehicle consumption assumption. Road-distance API output alone is not measured energy saved. Label estimates and simulated telemetry clearly; do not claim an emissions reduction without a separately justified emissions calculation.

## 11. Delivery order and completion criteria

No deadline or team size was supplied, so this is a dependency-based plan rather than a promised schedule.

| Stage | Work | Done when |
|---|---|---|
| A: Truthful prototype | Harden the new Nova integration; separate demo/live modes; remove confident fallback and synthetic trace events; correct visible claims | Validated image inference works; failures and unknown lot IDs cannot look verified; demo data is unmistakable |
| B: Reliable foundation | Persistence, authenticated roles, state transitions, measurement/unit fixes, QR redemption | Records survive restart; unauthorized/replayed/conflicting operations are rejected; deductions calculate correctly |
| C: Real AWS journey | Deploy frontend/API; verify existing Bedrock integration in deployment; connect S3; instrument logs | A fresh photo becomes a saved lot, accepted handover, and retrievable receipt through deployed services |
| D: Collector usefulness | Simple mobile flow, audio, earnings, eligible buyer information | A collector can complete the core tasks without navigating the operator console |
| E: Resilience and impact | Offline queue, deduplication, measured recovery, disclosed energy factors | Airplane-mode demo succeeds; impact totals reconcile to recorded quantities |
| F: Optional extension | Pickup grouping, IoT telemetry, route optimization | Extension improves the same core workflow and has observable AWS evidence |

If time is very short, complete A–C and an honest demonstration of D; explicitly list offline sync and energy estimation as remaining work if unfinished. Do not call them implemented to fit the pitch.

## 12. Verification needed before submission

- Test a fresh non-preset image, a model timeout, malformed output, and an uncertain/hazardous item; no path should invent certainty.
- Test missing lots, unrelated callers, wrong receivers, expired/reused QR tokens, repeated confirmations, and invalid state transitions.
- Test kg versus item rates, unknown material, negative/excess deductions, payment-total consistency, and the recycler deduction regression.
- Test restart persistence, concurrent custody updates, offline retry, and duplicate operation delivery.
- Test bulk-lot allocation and recovery mass balance; original source measurements must remain available.
- Run the existing backend suite plus targeted negative tests; run frontend lint/build and one mobile end-to-end journey.

**Review execution status:** source and all seven existing test functions were inspected. The attempt to run `python3 -m pytest -p no:cacheprovider backend/tests -q` stopped because the available Python interpreter has no `pytest` module. No dependencies were installed. Frontend `node_modules` and backend local virtual environments were absent at the checked paths; frontend build/lint were not run. No live AWS calls, deployment checks, permit verification, or physical-device usability tests were performed. The README's “7/7 passed” badge is therefore not independently confirmed by this review.

## 13. Submission language and evidence

Use claims you can demonstrate: “prototype material triage,” “indicative reference prices,” “recorded handovers,” “self-reported recovery,” or “estimated energy benefit,” with live/demo status attached. Reserve “verified,” “immutable,” “escrow,” “live market pricing,” and “official EPR certificate” for proven capabilities.

The existing hash output should be called an internal audit reference, not an official CPCB certificate. CPCB's FAQ describes EPR certificates in relation to recyclers registered on its E-Waste EPR Portal; the repository provides no integration demonstrating that process. This report does not certify regulatory compliance. [CPCB E-Waste FAQ](https://cpcb.nic.in/uploads/Projects/E-Waste/FAQ_ewaste_23012024.pdf).

Prepare a short evidence pack: problem and target user, actual architecture, live-versus-demo feature table, one complete transaction recording, relevant AWS logs/resources, failure/offline behavior, impact assumptions, and remaining work. Include pilot feedback only after collecting it. Do not expose credentials, personal data, or private evidence objects in screenshots.

Suggested demo narrative: a collector identifies a material, hears guidance, checks a price, records a measured lot, finds an eligible buyer, agrees a handover, and retrieves a receipt. Then show a hazardous/unknown case being escalated rather than misclassified. Finish with recovery-based impact and the exact AWS services supporting the journey.

**Next checkpoint:** phase 1 has local automated verification; live AWS verification remains outstanding. Phase 2 addresses truthful traceability and transaction arithmetic. See the implementation status at the top rather than treating the historical review findings as current phase-1 behavior.
