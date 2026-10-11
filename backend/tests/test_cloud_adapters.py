"""Contract-level tests; no live AWS requests or credentials."""
import json
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException
from app.platform import store
from app.config import settings

def revision(n):
    return {'Item':{'body':{'S':json.dumps({'version':n})}}}

def test_dynamodb_rejects_snapshot_changed_during_pagination(monkeypatch):
    monkeypatch.setattr(settings,'STORE_BACKEND','dynamodb');monkeypatch.setattr(settings,'DYNAMODB_TABLE','test')
    client=MagicMock();client.get_item.side_effect=[revision(1),revision(2)];client.query.return_value={'Items':[]}
    monkeypatch.setattr(store.boto3,'client',lambda *a,**k:client)
    with pytest.raises(HTTPException) as e:
        with store.transaction(): pass
    assert e.value.status_code==409
    client.transact_write_items.assert_not_called()

def test_dynamodb_atomic_commit_includes_conditional_revision(monkeypatch):
    monkeypatch.setattr(settings,'STORE_BACKEND','dynamodb');monkeypatch.setattr(settings,'DYNAMODB_TABLE','test')
    client=MagicMock();client.get_item.return_value={};client.query.return_value={'Items':[]}
    monkeypatch.setattr(store.boto3,'client',lambda *a,**k:client)
    with store.transaction() as db: db.put('lot','one',{'id':'one'})
    writes=client.transact_write_items.call_args.kwargs['TransactItems']
    assert len(writes)==2
    assert writes[-1]['Put']['ConditionExpression']=='attribute_not_exists(pk)'

def test_rollback_does_not_persist_partial_write():
    with pytest.raises(RuntimeError):
        with store.transaction() as db:
            db.put('lot','one',{'id':'one'})
            raise RuntimeError('Simulated failure')
    with store.transaction() as db: assert db.all('lot')==[]
