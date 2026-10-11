# ScrapSetu API

FastAPI app: `app.main:app`. Authoritative endpoints: `/api/v2`; protected legacy image triage remains at `/api/v1/triage`. `/docs` lists actual mounted routes. Former in-memory lot/payment/vendor/recycler mutation APIs are not mounted.

From this directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
.venv/bin/python -m pytest tests -q
```

Load settings from `backend/.env`. See [full environment guide](../docs/setup/environment.md) and [AWS deployment](../infrastructure/README.md). Local development uses SQLite and disk evidence under ignored `data/`; Lambda uses DynamoDB and private S3. Writes require `Idempotency-Key`; record-changing operations additionally check explicit versions. Do not deploy local sign-in publicly.
