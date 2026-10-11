from mangum import Mangum
from app.main import app
from app.platform.models import Telemetry
from app.platform.fleet import ingest
from app.platform.store import transaction

http = Mangum(app, lifespan='off')

def handler(event, context):
    # IoT can invoke this path only through the separately scoped Lambda permission.
    if event.get('source') == 'scrapsetu.iot' and 'requestContext' not in event:
        payload = {k:v for k,v in event.items() if k != 'source'}
        with transaction() as db:
            try:
                return ingest(db, Telemetry.model_validate(payload))
            except Exception as error:
                if getattr(error, 'status_code', None) == 409:
                    return {'status': 'duplicate_ignored'}
                raise
    return http(event, context)
