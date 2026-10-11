import base64
import hashlib
import io
from pathlib import Path
import boto3
from botocore.config import Config
from fastapi import HTTPException
from app.config import settings
from app.services.ai_triage import AITriageService

def aws(name):
    return boto3.client(name, region_name=settings.AWS_REGION,
                        config=Config(connect_timeout=5, read_timeout=30, retries={'total_max_attempts': 2}))

def save_evidence(user, encoded):
    data, fmt = AITriageService._decode_image(encoded)
    digest = hashlib.sha256(data).hexdigest()
    key = f'evidence/{user.id}/{digest}.{fmt}'
    if settings.AWS_S3_BUCKET:
        aws('s3').put_object(Bucket=settings.AWS_S3_BUCKET, Key=key, Body=data,
                             ContentType='image/' + fmt, ServerSideEncryption='AES256')
    else:
        path = Path(settings.DATA_DIR) / 'objects' / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    return {'id': digest + '-' + hashlib.sha256(user.id.encode()).hexdigest()[:12],
            'owner_id': user.id, 'key': key, 'content_type': 'image/' + fmt}

def read_evidence(record):
    if settings.AWS_S3_BUCKET:
        return aws('s3').get_object(Bucket=settings.AWS_S3_BUCKET, Key=record['key'])['Body'].read()
    return (Path(settings.DATA_DIR) / 'objects' / record['key']).read_bytes()

GUIDANCE = {
    'en': {'welcome': 'Take a photo, select the material and enter the actual scale weight. Your draft can be saved offline.',
           'safety': 'Do not burn, dismantle or mix unknown waste. Ask a qualified recycler to inspect damaged batteries, chemicals and pressurized items.',
           'receipt': 'Check the measured weight, deductions and final price before accepting the handover. Confirm payment only after you receive it.'},
    'hi': {'welcome': 'फोटो लें, सामग्री चुनें और तराजू पर मापा हुआ वजन दर्ज करें। बिना इंटरनेट भी विवरण सुरक्षित कर सकते हैं।',
           'safety': 'अज्ञात कचरे को न जलाएं, न खोलें और न मिलाएं। खराब बैटरी, रसायन और दबाव वाले सामान की जांच योग्य विशेषज्ञ से कराएं।',
           'receipt': 'सामान सौंपने से पहले वजन, कटौती और अंतिम कीमत जांचें। पैसे मिलने के बाद ही भुगतान की पुष्टि करें।'},
}

def speech(language, key):
    if language not in GUIDANCE or key not in GUIDANCE[language]:
        raise HTTPException(404, 'Guidance not found')
    if not settings.POLLY_ENABLED:
        raise HTTPException(503, 'Polly is disabled; device speech may be available')
    text = GUIDANCE[language][key]
    name = hashlib.sha256(text.encode()).hexdigest() + '.mp3'
    path = Path(settings.DATA_DIR) / 'audio' / name
    if path.exists():
        return path.read_bytes()
    response = aws('polly').synthesize_speech(Text=text, VoiceId='Aditi', Engine='standard',
                   LanguageCode='hi-IN' if language == 'hi' else 'en-IN', OutputFormat='mp3')
    data = response['AudioStream'].read()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data
