import os
import zipfile
import urllib.request
import boto3
from dotenv import load_dotenv

load_dotenv('.env')

app_id = 'd2fltoisfazp12'
branch_name = 'main'

# 1. Zip frontend/dist
zip_path = 'frontend/dist.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk('frontend/dist'):
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, 'frontend/dist')
            z.write(full_path, arcname)
print(f"Created {zip_path}")

# 2. Amplify Client
amplify = boto3.client(
    'amplify',
    region_name='us-east-1',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

# 3. Create Deployment
deployment = amplify.create_deployment(appId=app_id, branchName=branch_name)
upload_url = deployment['zipUploadUrl']
job_id = deployment['jobId']

# 4. Upload zip
with open(zip_path, 'rb') as f:
    zip_bytes = f.read()

req = urllib.request.Request(
    upload_url,
    data=zip_bytes,
    headers={'Content-Type': 'application/zip'},
    method='PUT'
)
with urllib.request.urlopen(req) as resp:
    print(f"Uploaded zip: HTTP {resp.status}")

# 5. Start Deployment
amplify.start_deployment(appId=app_id, branchName=branch_name, jobId=job_id)
print(f"Amplify deployment started successfully! Job ID: {job_id}")

