"""Small-pilot document unit of work with atomic SQLite/DynamoDB commits.

Records are separate items. DynamoDB queries are strongly consistent; the revision
record is a global optimistic lock, preventing phantoms/double allocations. This
intentionally serializes writes for a hackathon pilot, not a high-throughput design.
"""
import copy
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException
from app.config import settings

class Records:
    def __init__(self, items):
        self.items = items
    def all(self, kind):
        return [v for k, v in self.items.items() if k.startswith(kind + '#')]
    def get(self, kind, key):
        return self.items.get(kind + '#' + key)
    def require(self, kind, key):
        item = self.get(kind, key)
        if item is None:
            raise HTTPException(404, f'{kind} not found')
        return item
    def put(self, kind, key, value):
        self.items[kind + '#' + key] = value

@contextmanager
def transaction():
    if settings.STORE_BACKEND == 'sqlite':
        root = Path(settings.DATA_DIR)
        root.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(str(root / 'ledger.sqlite3'), timeout=15)
        try:
            connection.execute('PRAGMA journal_mode=WAL')
            connection.execute('CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY, body TEXT NOT NULL)')
            connection.execute('BEGIN IMMEDIATE')
            old = {k: json.loads(v) for k, v in connection.execute('SELECT key, body FROM records')}
            records = Records(copy.deepcopy(old))
            yield records
            for key, value in records.items.items():
                if old.get(key) != value:
                    if key.startswith('event#') and key in old:
                        raise RuntimeError('Audit events cannot be overwritten')
                    connection.execute('INSERT INTO records VALUES (?,?) ON CONFLICT(key) DO UPDATE SET body=excluded.body',
                                       (key, json.dumps(value, allow_nan=False)))
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()
    else:
        client = boto3.client('dynamodb', region_name=settings.AWS_REGION)
        def revision():
            item = client.get_item(TableName=settings.DYNAMODB_TABLE, Key={"pk": {"S": "PILOT"}, "sk": {"S": "_revision"}}, ConsistentRead=True).get("Item")
            return item["body"]["S"] if item else None
        before = revision()
        items = []
        query = dict(TableName=settings.DYNAMODB_TABLE, KeyConditionExpression='pk = :pk',
                     ExpressionAttributeValues={':pk': {'S': 'PILOT'}}, ConsistentRead=True)
        while True:
            page = client.query(**query)
            items.extend(page['Items'])
            if 'LastEvaluatedKey' not in page:
                break
            query['ExclusiveStartKey'] = page['LastEvaluatedKey']
        if before != revision():
            raise HTTPException(409, 'Concurrent change while reading. Retry the same operation ID.')
        old = {v['sk']['S']: json.loads(v['body']['S']) for v in items}
        version = old.get('_revision', {}).get('version', 0)
        records = Records(copy.deepcopy(old))
        yield records
        changed = {k: v for k, v in records.items.items() if old.get(k) != v}
        if not changed:
            return
        if len(changed) > 98:
            raise HTTPException(422, 'Operation too large; use smaller batches')
        writes = []
        for key, value in changed.items():
            if key.startswith('event#') and key in old:
                raise RuntimeError('Audit events cannot be overwritten')
            body = json.dumps(value, allow_nan=False)
            if len(body.encode()) > 350_000:
                raise HTTPException(422, 'Record too large; put evidence in object storage')
            writes.append({'Put': {'TableName': settings.DYNAMODB_TABLE,
                                  'Item': {'pk': {'S': 'PILOT'}, 'sk': {'S': key}, 'body': {'S': body}}}})
        lock = {'TableName': settings.DYNAMODB_TABLE,
                'Item': {'pk': {'S': 'PILOT'}, 'sk': {'S': '_revision'},
                         'body': {'S': json.dumps({'version': version + 1})}}}
        if '_revision' in old:
            lock.update(ConditionExpression='body = :old',
                        ExpressionAttributeValues={':old': {'S': json.dumps({'version': version})}})
        else:
            lock['ConditionExpression'] = 'attribute_not_exists(pk)'
        writes.append({'Put': lock})
        try:
            client.transact_write_items(TransactItems=writes)
        except ClientError as error:
            if error.response['Error']['Code'] in {'TransactionCanceledException', 'TransactionConflictException'}:
                raise HTTPException(409, 'Concurrent change. Refresh and retry the same operation ID.') from error
            raise
