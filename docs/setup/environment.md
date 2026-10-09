# Environment Configuration & Cloud Services Setup

This guide details all required and optional environment variables for **ScrapSetu**, their purpose in the platform, and how to obtain or generate the required credentials and endpoints.

---

## Environment Variables Matrix

| Service / Provider | Environment Variable | Purpose | How to Obtain |
| :--- | :--- | :--- | :--- |
| **AWS IAM Credentials** | `AWS_ACCESS_KEY_ID`<br>`AWS_SECRET_ACCESS_KEY`<br>`AWS_REGION` | Grants permission to invoke AWS cloud services (Bedrock, S3, IoT Core). | Generated in **AWS IAM Console** &rarr; **Security Credentials**. |
| **Amazon Bedrock (LLM / Vision)** | `BEDROCK_MODEL_ID`<br>*(e.g., `anthropic.claude-3-5-sonnet-20241022-v2:0`)* | Powers zero-shot multimodal visual scrap decomposition and hazard identification. | Enabled in **AWS Bedrock Console** &rarr; **Model Access**. |
| **Amazon S3 Storage** | `AWS_S3_BUCKET`<br>*(e.g., `scrapsetudb-scrap-images`)* | Stores user-uploaded scrap photos via pre-signed URLs and generates audit PDFs. | Created in **AWS S3 Console**. |
| **AWS IoT Core** | `AWS_IOT_ENDPOINT`<br>*(e.g., `a3xxxxxxx-ats.iot.us-east-1.amazonaws.com`)* | Ingests MQTT telemetry packets published by smart bin sensors over TLS/X.509. | Found in **AWS IoT Core Console** &rarr; **Settings**. |
| **Cryptographic QR Secret** | `SECRET_KEY` | Signs dynamic QR code payloads using HMAC-SHA256 for dual-key handover. | Configured locally in `.env` (Any secure string). |
| **PostgreSQL + PostGIS (Optional)** | `DATABASE_URL`<br>*(e.g., `postgresql://user:pass@localhost:5432/scrapsetudb`)* | Relational database ledger managing digital waste lots and spatial queries (`ST_DWithin`). | Local Docker PostgreSQL or AWS RDS for PostgreSQL. |

---

## Detailed Service Setup Instructions

### 1. AWS IAM Credentials
1. Log into your **AWS Management Console**.
2. Navigate to **IAM (Identity and Access Management)** &rarr; **Users**.
3. Select or create an IAM User with appropriate execution policies (`AmazonBedrockFullAccess`, `AmazonS3FullAccess`, `AWSIoTFullAccess`).
4. Under the **Security credentials** tab, click **Create access key**.
5. Copy the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` into your local `.env` file.
6. Set `AWS_REGION` to your primary AWS region (e.g., `us-east-1`).

### 2. Amazon Bedrock (Multimodal AI & Hazard Detection)
1. In the AWS Console, open **Amazon Bedrock**.
2. Go to **Model access** in the left sidebar.
3. Request and enable access for **Anthropic Claude 3.5 Sonnet** (Model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`).
4. Once granted, verify the model ID matches `BEDROCK_MODEL_ID` in your `.env`.

### 3. Amazon S3 Storage
1. Navigate to the **Amazon S3** console.
2. Click **Create bucket**.
3. Provide a unique bucket name (e.g., `scrapsetudb-scrap-images`).
4. Configure CORS settings if direct browser uploads are used.
5. Set `AWS_S3_BUCKET` in `.env`.

### 4. AWS IoT Core (Smart Bin Telemetry)
1. Navigate to **AWS IoT Core**.
2. In the left navigation menu, click **Settings**.
3. Locate the **Device data endpoint** (format: `xxxxxxxxxxxxxx-ats.iot.<region>.amazonaws.com`).
4. Set `AWS_IOT_ENDPOINT` in `.env`.

### 5. Cryptographic QR Secret
1. Generate a cryptographically secure random string (e.g., run `openssl rand -hex 32` or `python -c "import secrets; print(secrets.token_hex(32))"`).
2. Assign the output to `SECRET_KEY` in `.env`.
3. This secret is used for HMAC-SHA256 digital signature validation during QR-based chain-of-custody handovers.

### 6. PostgreSQL with PostGIS
1. Run PostgreSQL with PostGIS enabled locally using Docker:
   ```bash
   docker run --name scrapsetu-postgis -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=scrapsetudb -p 5432:5432 -d postgis/postgis:15-3.3
   ```
2. Or provision an Amazon RDS for PostgreSQL instance with the PostGIS extension.
3. Update `DATABASE_URL` in `.env`.
