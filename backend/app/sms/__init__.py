"""SMS entry point — mirrors the email module.

Backends:
  - `console` (default for dev): logs the message instead of sending. Lets you
    exercise the OTP / 2FA flows offline.
  - `twilio`: real delivery via Twilio's REST API. Configured via the runtime
    settings table — no SDK needed, just httpx + Basic auth.
"""
import logging

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def send_sms(*, to: str, body: str, db: Session | None = None) -> None:
    backend = _resolve_backend(db)
    if backend == "twilio":
        from app.sms.twilio import send_twilio

        send_twilio(to=to, body=body, db=db)
    else:
        # Console — print/log only. Don't crash the calling flow.
        logger.info("SMS [console] to=%s body=%r", to, body)


def _resolve_backend(db: Session | None) -> str:
    if db is None:
        return "console"
    from app.services.settings_service import SettingsService

    v = SettingsService(db).get_raw("sms.backend")
    return (v or "console").strip().lower()
