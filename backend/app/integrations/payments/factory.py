"""Single source of truth for `which provider is active`.

Cached so repeated requests don't reopen Redis clients or re-read env vars.
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.integrations.payments.base import PaymentProvider
from app.integrations.payments.mock import MockProvider
from app.integrations.payments.phonepe import PhonePeProvider

_PHONEPE_BASE = {
    "sandbox": "https://api-preprod.phonepe.com/apis/pg-sandbox",
    "production": "https://api.phonepe.com/apis/hermes",
}


@lru_cache
def get_payment_provider() -> PaymentProvider:
    provider = (settings.PAYMENT_PROVIDER or "mock").lower()
    if provider == "phonepe":
        return PhonePeProvider(
            merchant_id=settings.PHONEPE_MERCHANT_ID,
            salt_key=settings.PHONEPE_SALT_KEY,
            salt_index=settings.PHONEPE_SALT_INDEX,
            base_url=_PHONEPE_BASE.get(settings.PHONEPE_ENV.lower(), _PHONEPE_BASE["sandbox"]),
            callback_url=settings.PAYMENT_WEBHOOK_URL,
        )
    # Default to mock so the app is demoable without merchant credentials.
    return MockProvider(
        frontend_url=settings.FRONTEND_URL,
        redis_url=settings.REDIS_URL,
    )
