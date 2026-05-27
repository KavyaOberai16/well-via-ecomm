"""Shipping provider factory.

Unlike the payments factory (which reads env), this one reads runtime
settings from the database via SettingsService. The admin can flip
`shipping.provider` in the panel and the next request picks up the new
choice — no restart, no env var edit.

We do NOT lru_cache the result because the underlying settings can change.
Each request that needs a provider calls `get_shipping_provider(db)` and we
build a fresh instance — the cost is negligible (just constructor args),
and the alternative (manual cache invalidation on every settings write) is
strictly worse for the same outcome.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings as env_settings
from app.integrations.shipping.base import ShippingProvider
from app.integrations.shipping.delhivery import DelhiveryProvider
from app.integrations.shipping.mock import MockShippingProvider
from app.integrations.shipping.none import NoneShippingProvider
from app.services.settings_service import SettingsService


def get_shipping_provider(db: Session) -> ShippingProvider:
    s = SettingsService(db)
    name = (s.get_raw("shipping.provider") or "none").strip().lower()

    if name == "mock":
        return MockShippingProvider(redis_url=env_settings.REDIS_URL)

    if name == "delhivery":
        return DelhiveryProvider(
            api_token=s.get_raw("shipping.delhivery.api_token") or "",
            client_name=s.get_raw("shipping.delhivery.client_name") or "",
            environment=(s.get_raw("shipping.environment") or "staging"),
            warehouse_name=s.get_raw("shipping.warehouse.name"),
            warehouse_pincode=s.get_raw("shipping.warehouse.pincode"),
            warehouse_address=s.get_raw("shipping.warehouse.address"),
            webhook_secret=s.get_raw("shipping.webhook_secret"),
        )

    # "none" or anything we don't recognize — fail closed to the disabled stub.
    return NoneShippingProvider()
