"""Symmetric encryption for at-rest secrets (TOTP secrets today, maybe more
later). Key is derived from SECRET_KEY so deployments don't need a separate
secret — same trade-off as the PASETO key derivation in core/security."""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _fernet() -> Fernet:
    # Fernet requires a 32-byte url-safe base64-encoded key.
    raw = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(raw))


def encrypt_secret(plain: str) -> str:
    return _fernet().encrypt(plain.encode("utf-8")).decode("utf-8")


def decrypt_secret(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        # Likely cause: SECRET_KEY rotated under us. Let caller decide whether
        # to re-enroll the user or surface an error.
        raise ValueError("Could not decrypt — key may have changed") from exc
