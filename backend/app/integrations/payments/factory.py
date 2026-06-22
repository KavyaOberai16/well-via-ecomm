"""Payment provider factory.

Reads the active gateway + PhonePe credentials from the dedicated
`payment_gateway_config` table (via PaymentGatewayService) rather than `.env`.
The admin flips the provider / pastes credentials on the Payment Gateway admin
screen and the next request picks up the new choice — no restart.

We do NOT cache the result because the underlying config can change. Each
request that needs a provider calls `get_payment_provider(db)` and we build a
fresh instance — the cost is negligible (just constructor args).

The redirect/webhook URLs stay in `.env` (they're deployment-specific), so
`callback_url` and the MockProvider's `frontend_url`/`redis_url` come from
`env_settings`.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings as env_settings
from app.integrations.payments.base import PaymentProvider
from app.integrations.payments.mock import MockProvider
from app.integrations.payments.phonepe import PhonePeProvider
from app.services.payment_gateway_service import PaymentGatewayService

_PHONEPE_BASE = {
    "sandbox": "https://api-preprod.phonepe.com/apis/pg-sandbox",
    "production": "https://api.phonepe.com/apis/hermes",
}


def get_payment_provider(db: Session) -> PaymentProvider:
    svc = PaymentGatewayService(db)
    cfg = svc.get()

    if (cfg.provider or "mock").strip().lower() == "phonepe":
        environment = (cfg.phonepe_environment or "sandbox").strip().lower()
        return PhonePeProvider(
            merchant_id=cfg.phonepe_merchant_id or "",
            salt_key=svc.decrypted_salt_key(cfg),
            salt_index=cfg.phonepe_salt_index or 1,
            base_url=_PHONEPE_BASE.get(environment, _PHONEPE_BASE["sandbox"]),
            callback_url=env_settings.PAYMENT_WEBHOOK_URL,
        )

    # Default to mock so the app is demoable without merchant credentials.
    return MockProvider(
        frontend_url=env_settings.FRONTEND_URL,
        redis_url=env_settings.REDIS_URL,
    )
