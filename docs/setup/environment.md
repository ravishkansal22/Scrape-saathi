# ScrapSetu: local and AWS configuration

## Running locally

Use Node 22+ and Python 3.11/3.12 (the current checkout was also tested with Python 3.9). From the repository root:

```sh
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt
cp .env.example backend/.env  # only if you have not already created it
cd frontend
npm ci
npm run build
```

Start the API in one terminal, from `backend`:

```sh
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Start the frontend in another, from `frontend`:

```sh
npm run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://127.0.0.1:5173**. API docs: **http://127.0.0.1:8001/docs**. Port 8001 avoids another application already using 8000 on this workstation. Vite proxies `/api` to 8001; set `BACKEND_PROXY_URL` when starting Vite to change this. `npm run dev` supports UI development, but the service worker is enabled only in production builds/preview. Browser offline mode requires localhost or HTTPS.

Local accounts: `collector_demo`, `vendor_demo`, `recycler_demo`, `admin_demo`. All use `scrapsetu-local`, unless changed through `LOCAL_DEMO_PASSWORD`. These are development fixtures; production disables this sign-in completely. All newly created local lots are labeled demo, including manual entries.

The backend loads **backend/.env**, not the root `.env`. It now exists in this checkout with local defaults, no AWS credentials, and owner-only permissions. Existing environment variables take precedence. SQLite, evidence and a generated signing key live in ignored `backend/data/`; keep that directory across restarts. Offline drafts live in the browser's IndexedDB, separated by account. Clearing browser data removes drafts; signing out keeps them for that same account.

## Minimum backend/.env for local testing

```dotenv
APP_ENV=development
AUTH_MODE=local
STORE_BACKEND=sqlite
LOCAL_DEMO_PASSWORD=scrapsetu-local
SECRET_KEY=
FRONTEND_URL=http://127.0.0.1:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
POLLY_ENABLED=false
LOCATION_ENABLED=false
```

Leaving `SECRET_KEY` blank in development creates a persistent random key; production requires at least 32 characters supplied securely. Do not rotate it during a handover: outstanding QR tokens will stop validating. No cloud credentials are necessary for explicit demo samples, manual lots, receipts, local evidence, offline capture or straight-line route estimates. Uploaded-photo identification is a real Bedrock call and will report unavailable until AWS is configured; there is no fake fallback.

## Add real photo AI to the local app

Configure an AWS CLI profile with valid account credentials or SSO outside the repository, then add:

```dotenv
AWS_PROFILE=scrapsetu
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
```

Alternatively use all applicable temporary credential fields in **backend/.env**:

```dotenv
AWS_ACCESS_KEY_ID=<actual access key>
AWS_SECRET_ACCESS_KEY=<actual secret key>
AWS_SESSION_TOKEN=<required for temporary credentials>
```

Use one credential method. Never put these in frontend variables or Git. The account/region must allow invocation of the selected Nova model. The principal needs `bedrock:InvokeModel` on its actual model ARN. If using an inference profile, update both the model ID and the IAM policy for that profile and its target model resources. The supplied infrastructure defaults to a direct regional model in us-east-1. Restart the backend after env changes. The live inference call has one SDK attempt, a 3-second connect timeout, and a 20-second read timeout to fit the cloud HTTP request budget. Slow calls fail explicitly; this pilot has no asynchronous inference queue.

## Optional AWS services from your local app

| Variable | Actual value needed | Effect / permission |
|---|---|---|
| `AWS_S3_BUCKET` | Private bucket name, no `s3://` | Stores evidence with AES256; `s3:PutObject`, `s3:GetObject` on `evidence/*` |
| `STORE_BACKEND` | `dynamodb` | Switches ledger from SQLite; does not migrate existing SQLite records |
| `DYNAMODB_TABLE` | Table with string partition key `pk`, sort key `sk` | Query/GetItem/PutItem permissions; transactions commit mutations atomically |
| `POLLY_ENABLED` | `true` | `polly:SynthesizeSpeech`; static English/Hindi Aditi guidance |
| `LOCATION_ENABLED` | `true` | `geo-routes:CalculateRouteMatrix`; road distances replace straight-line estimates |
| `AWS_IOT_ENDPOINT` | Account's IoT data ATS hostname | Routes simulator readings through IoT rather than direct local ingestion |
| `AWS_IOT_TOPIC` | `scrapsetu/bins` | Must match the IoT rule and publish policy |
| `DATA_DIR` | Writable persistent absolute directory | Local SQLite/evidence/audio/key path; Lambda uses `/tmp/scrapsetu` for audio cache only |

For IoT, merely setting the endpoint is insufficient: deploy the topic rule and Lambda permission. Find the hostname with `aws iot describe-endpoint --endpoint-type iot:Data-ATS`. Local `/fleet/telemetry` is authenticated admin-only; device messages should use separately provisioned IoT certificates and topic-scoped policies. No hardware device provisioning is claimed.

Polly audio is cached after playback. With Polly disabled/unavailable, the app tries device speech and discloses the fallback; voice availability depends on the device. The app's guidance is bilingual; all administrative forms are currently English.

## Cloud production values

The SAM template sets these from created resources; Lambda uses its IAM role, **not static access keys**:

```dotenv
APP_ENV=production
AUTH_MODE=cognito
STORE_BACKEND=dynamodb
SECRET_KEY=<unique secret, at least 32 characters>
DYNAMODB_TABLE=<stack LedgerTable output>
AWS_S3_BUCKET=<stack EvidenceBucket output>
AWS_REGION=<deployment region>
FRONTEND_URL=https://<actual frontend origin>
CORS_ORIGINS=https://<actual frontend origin>
COGNITO_USER_POOL_ID=<stack UserPoolId output>
COGNITO_CLIENT_ID=<stack UserPoolClientId output>
COGNITO_DOMAIN=https://<prefix>.auth.<region>.amazoncognito.com
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
POLLY_ENABLED=true
LOCATION_ENABLED=true
AWS_IOT_ENDPOINT=<ATS hostname>
AWS_IOT_TOPIC=scrapsetu/bins
DATA_DIR=/tmp/scrapsetu
```

`FRONTEND_URL` and `COGNITO_DOMAIN` have no trailing slash. Cognito callbacks/logout URLs include the final `/`. Users must belong to **exactly one** application group: `collector`, `vendor`, `recycler`, or `admin`. Create/assign users administratively. Sign-in uses authorization-code PKCE; server validates access-token signature, issuer, expiry, client ID, purpose and group. Tokens expire; sign in again when requested. There is no refresh-token session implementation yet.

## Frontend environment

Copy `frontend/.env.example` to `frontend/.env` only if needed:

```dotenv
VITE_API_BASE_URL=/api
```

For deployed Amplify hosting, use the API origin plus `/api`:

```dotenv
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/api
```

Rebuild after changing this value. The frontend obtains public Cognito configuration from `/api/v2/config`. All `VITE_*` values become public JavaScript: never use them for secrets.

## Test the complete journey

1. Collector: choose **Try a labeled demo sample → electric motor**, select copper, enter an actual test weight, save. Manual/offline or hazardous entries require an administrator's documented inspection first. Hazard flags persist after review; a hazardous lot also requires the facility's specialist hazardous-material scope (`battery` in this pilot catalog).
2. Collector: open **Lots**, select the lot, offer it to the demo recycler. Copy the signed QR token.
3. Recycler: sign in separately, open **Handovers**, paste/scan the token, enter the scale weight and deduction. The named receiver alone can redeem it.
4. Collector: accept the proposed final weight and price. Recycler then reports payment; collector confirms only after receipt. The system records acknowledgement, not a bank transfer.
5. Recycler: open the received lot, upload recovery evidence, enter recovered mass and residue summing to the available input. Inspect actual event history and download the JSON receipt.
6. Impact: demo and recorded quantities are separate. Energy remains **Not estimated** until an administrator adds a documented factor. Factors are snapshotted at recovery time, never applied retrospectively.
7. Offline: open the built app online once, sign in, switch browser/network offline, save a manual lot, reload, reconnect. Drafts sync with stable operation IDs. Rejected drafts stay visible for retry; expired sessions require sign-in.
8. Admin: review permits, enter sourced prices, resolve disputes, publish simulated bin readings and plan capacity-limited trips. Route results disclose simulation, straight-line/road basis and vehicle-energy assumptions.

Use separate browser profiles/private windows for roles, or sign out and switch accounts. Browser QA created clearly named test lots in this local database. Do not present demo permits or QA records as real authorized recycling.

## Verification and limits

Run backend tests with `backend/.venv/bin/python -m pytest backend/tests -q`; frontend tests with `npm test --prefix frontend`; build with `npm run build --prefix frontend`. With both servers running, `cd frontend && npx playwright test` tests offline reload/sync and cross-role handover/payment. Browser tests create labeled local QA records. Install Chromium once with `npx playwright install chromium`.

See `infrastructure/README.md` for deployment. Cloud provisioning, live Bedrock/S3/Cognito/Polly/IoT/Location verification, genuine recycler permit checks, reference-price feeds, scientific factor selection, load testing and collector usability testing remain external validation tasks. An `.env` alone cannot supply those resources or evidence. The pilot uses one DynamoDB partition and a global revision lock; redesign access patterns before scaling. Audit records are append-only through this API, not independently tamper-proof. Payments are party-acknowledged; receipts are not regulatory EPR certificates.
