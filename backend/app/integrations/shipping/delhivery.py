"""Delhivery REST integration.

Phase-1 scaffolding only — every method that talks to Delhivery raises
`ProviderNotConfiguredError` until the corresponding phase fills it in:

  Phase 2 → `serviceability` (`GET /c/api/pin-codes/json/`)
  Phase 3 → `rate_quote`     (`GET /api/kinko/v1/invoice/charges/.json`)
  Phase 4 → `create_shipment` + `_fetch_waybill`
  Phase 5 → `schedule_pickup` + `label_pdf`
  Phase 6 → `fetch_tracking` + webhook handlers

Why ship the class now? Because the factory has to choose between providers
*today* — the mock, none, and Delhivery options must all resolve. Filling
in the bodies later is a no-risk surgical edit; switching the provider
mechanism later would be churn.

Reference (Delhivery API docs):

  Staging base URL:    https://staging-express.delhivery.com
  Production base URL: https://track.delhivery.com
  Auth header:         "Authorization: Token <api_token>"
"""
from __future__ import annotations

import logging
from typing import Final

from app.integrations.shipping.base import (
    PickupRequest,
    PickupResult,
    ProviderNotConfiguredError,
    RateQuote,
    RateQuoteRequest,
    ServiceabilityResult,
    ShipmentRequest,
    ShipmentResult,
    TrackingUpdate,
)

logger = logging.getLogger(__name__)

_BASE_URLS: Final[dict[str, str]] = {
    "staging":    "https://staging-express.delhivery.com",
    "production": "https://track.delhivery.com",
}


class DelhiveryProvider:
    name = "delhivery"

    def __init__(
        self,
        *,
        api_token: str,
        client_name: str,
        environment: str = "staging",
        warehouse_name: str | None = None,
        warehouse_pincode: str | None = None,
        warehouse_address: str | None = None,
        webhook_secret: str | None = None,
    ):
        self.api_token = api_token
        self.client_name = client_name
        self.base_url = _BASE_URLS.get(environment.lower(), _BASE_URLS["staging"])
        self.environment = environment.lower()
        self.warehouse_name = warehouse_name
        self.warehouse_pincode = warehouse_pincode
        self.warehouse_address = warehouse_address
        self.webhook_secret = webhook_secret

    # ---- placeholder methods — filled in by later phases ----

    def _not_yet(self, phase: str) -> ProviderNotConfiguredError:
        return ProviderNotConfiguredError(
            f"Delhivery {phase} is not wired yet. Switch shipping.provider to "
            "'mock' to exercise this flow until phase ships."
        )

    def serviceability(self, pincode: str) -> ServiceabilityResult:
        raise self._not_yet("serviceability")

    def rate_quote(self, req: RateQuoteRequest) -> RateQuote:
        raise self._not_yet("rate quoting")

    def create_shipment(self, req: ShipmentRequest) -> ShipmentResult:
        raise self._not_yet("shipment creation")

    def schedule_pickup(self, req: PickupRequest) -> PickupResult:
        raise self._not_yet("pickup scheduling")

    def label_pdf(self, awb_number: str) -> bytes:
        raise self._not_yet("label download")

    def fetch_tracking(self, awb_number: str) -> TrackingUpdate:
        raise self._not_yet("tracking")

    def verify_webhook(self, body: bytes, signature: str | None) -> bool:
        # Without phase 6 wired we reject everything — better than silently
        # accepting unsigned bodies.
        return False

    def parse_webhook(self, body: bytes) -> TrackingUpdate:
        raise self._not_yet("webhook parsing")
