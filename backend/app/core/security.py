"""Password hashing and PASETO v4.local token issuance.

Tokens are PASETO v4.local — symmetric, authenticated encryption. The 32-byte
key is derived deterministically from SECRET_KEY, so existing configuration
keeps working with no new environment variable.
"""
import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Any

import pyseto
from passlib.context import CryptContext
from pyseto import Key
from pyseto.exceptions import PysetoError

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# PASETO v4.local requires a 32-byte symmetric key.
_paseto_key = Key.new(
    version=4,
    purpose="local",
    key=hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest(),
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(payload: dict[str, Any]) -> str:
    token = pyseto.encode(_paseto_key, payload, serializer=json)
    return token.decode("utf-8") if isinstance(token, bytes) else token


def create_access_token(subject: str | int, extra: dict[str, Any] | None = None) -> str:
    expire = _now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "exp": expire.isoformat(),
    }
    if extra:
        payload.update(extra)
    return _encode(payload)


def create_refresh_token(subject: str | int) -> str:
    expire = _now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(subject),
        "type": "refresh",
        "exp": expire.isoformat(),
    }
    return _encode(payload)


def decode_token(token: str) -> dict[str, Any]:
    try:
        decoded = pyseto.decode(_paseto_key, token, deserializer=json)
    except (PysetoError, ValueError, TypeError) as exc:
        raise UnauthorizedError("Invalid or malformed token") from exc

    payload = decoded.payload
    if not isinstance(payload, dict):
        raise UnauthorizedError("Invalid token payload")

    expires_at = payload.get("exp")
    if expires_at:
        try:
            exp = datetime.fromisoformat(expires_at)
        except (TypeError, ValueError) as exc:
            raise UnauthorizedError("Invalid token expiry") from exc
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if _now() >= exp:
            raise UnauthorizedError("Token has expired")

    return payload
