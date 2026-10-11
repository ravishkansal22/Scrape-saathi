import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

ROLES = ('collector', 'vendor', 'recycler', 'admin')
LOCAL_USERS = {role + '_demo': {'id': role + '_demo', 'name': role.title() + ' Demo', 'role': role} for role in ROLES}
security = HTTPBearer(auto_error=False)

@dataclass
class Actor:
    id: str
    name: str
    role: str

def signing_key():
    if settings.SECRET_KEY:
        return settings.SECRET_KEY
    if settings.APP_ENV == 'production':
        raise RuntimeError('Missing deployment secret')
    root = Path(settings.DATA_DIR)
    root.mkdir(parents=True, exist_ok=True)
    path = root / '.local-signing-key'
    try:
        with path.open('x') as output:
            path.chmod(0o600)
            output.write(secrets.token_hex(32))
    except FileExistsError:
        pass
    return path.read_text().strip()

def local_login(user, password):
    if settings.AUTH_MODE != 'local':
        raise HTTPException(404, 'Local sign-in is disabled')
    if user not in LOCAL_USERS or not secrets.compare_digest(password, settings.LOCAL_DEMO_PASSWORD):
        raise HTTPException(401, 'Invalid local credentials')
    actor = LOCAL_USERS[user]
    now = int(time.time())
    return {'access_token': jwt.encode({**actor, 'sub': user, 'iat': now, 'exp': now + 8*3600,
                                       'iss': 'scrapsetu-local', 'aud': 'scrapsetu'}, signing_key(), algorithm='HS256'),
            'user': actor}

@lru_cache(maxsize=4)
def jwks_client(issuer):
    return jwt.PyJWKClient(issuer + '/.well-known/jwks.json', timeout=5)

def actor(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(401, 'Sign in to continue')
    token = credentials.credentials
    try:
        if settings.AUTH_MODE == 'local':
            payload = jwt.decode(token, signing_key(), algorithms=['HS256'],
                                 issuer='scrapsetu-local', audience='scrapsetu', options={'require': ['exp', 'sub', 'iat']})
            if payload['sub'] not in LOCAL_USERS:
                raise ValueError('Unknown local user')
            return Actor(**LOCAL_USERS[payload['sub']])
        issuer = f'https://cognito-idp.{settings.AWS_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}'
        key = jwks_client(issuer).get_signing_key_from_jwt(token).key
        payload = jwt.decode(token, key, algorithms=['RS256'], issuer=issuer,
                             options={'verify_aud': False, 'require': ['exp', 'sub', 'iat']})
        if payload.get('token_use') != 'access' or payload.get('client_id') != settings.COGNITO_CLIENT_ID:
            raise ValueError('Wrong token purpose or client')
        roles = [r for r in ROLES if r in payload.get('cognito:groups', [])]
        if len(roles) != 1:
            raise ValueError('One assigned application role is required')
        return Actor(payload['sub'], payload.get('username', payload['sub']), roles[0])
    except (jwt.PyJWTError, ValueError, KeyError) as error:
        raise HTTPException(401, 'Invalid or expired session') from error

def require_role(user, *roles):
    if user.role not in roles:
        raise HTTPException(403, 'This role cannot perform that operation')

def token_for(payload):
    return jwt.encode({**payload, 'iss': 'scrapsetu-handover', 'aud': 'handover',
                       'exp': int(time.time()) + 7200}, signing_key(), algorithm='HS256')

def decode_handover(token):
    try:
        return jwt.decode(token, signing_key(), algorithms=['HS256'], issuer='scrapsetu-handover',
                          audience='handover', options={'require': ['exp', 'jti', 'transaction_id', 'receiver_id']})
    except jwt.PyJWTError as error:
        raise HTTPException(422, 'Handover QR is invalid or expired; ask the sender to reissue it') from error
