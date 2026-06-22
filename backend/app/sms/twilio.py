"""Direct-HTTP Twilio backend.

Twilio's Messages API is a single POST. Using httpx avoids a heavy SDK
dependency and means we control retries, timeouts, and error surfacing.
"""
from __future__ import annotations

import logging

import httpx
from sqlalchemy.orm import Session

from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)


class SmsConfigError(RuntimeError):
    """Raised when Twilio credentials are missing or malformed."""


def send_twilio(*, to: str, body: str, db: Session) -> dict:
    """Send a single SMS. Raises on failure so callers can surface or absorb.

    Returns the parsed Twilio response when successful (handy for the admin
    test-send endpoint).
    """
    svc = SettingsService(db)
    sid = (svc.get_raw("twilio.account_sid") or "").strip()
    token = (svc.get_raw("twilio.auth_token") or "").strip()
    sender = (svc.get_raw("twilio.from_number") or "").strip()

    if not (sid and token and sender):
        raise SmsConfigError(
            "Twilio is not fully configured. Set account_sid, auth_token, "
            "and from_number in admin → settings → SMS."
        )

    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    data = {"To": to, "From": sender, "Body": body}
    # Basic auth: sid:token
    resp = httpx.post(url, data=data, auth=(sid, token), timeout=15.0)
    if resp.status_code >= 400:
        # Twilio returns JSON error bodies — surface the message field if present.
        try:
            payload = resp.json()
            msg = payload.get("message", resp.text)
            code = payload.get("code")
        except Exception:
            msg = resp.text
            code = None
        raise SmsConfigError(
            f"Twilio rejected the message ({resp.status_code}): {msg}"
            + (f" [code {code}]" if code else "")
        )
    return resp.json()
