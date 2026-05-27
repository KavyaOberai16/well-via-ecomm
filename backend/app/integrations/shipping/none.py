"""Disabled-state provider.

Selected when `shipping.provider=none` — every call raises a uniform error
so callers (services, endpoints) don't have to special-case the disabled
state. The admin gets a clear message: *Enable a shipping provider first.*

The serviceability call is the one exception — we return a synthesized
"serviceable" result so existing checkout flows continue to work in stores
that haven't configured shipping yet (they don't charge for shipping and
ship manually). This is opinionated: a store wanting to *block* checkout
when shipping is disabled would switch to `mock` instead.
"""
from __future__ import annotations

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


class NoneShippingProvider:
    name = "none"

    def serviceability(self, pincode: str) -> ServiceabilityResult:
        return ServiceabilityResult(
            pincode=pincode,
            serviceable=True,
            remark="Shipping provider not configured — manual fulfillment.",
        )

    def _disabled(self) -> ProviderNotConfiguredError:
        return ProviderNotConfiguredError(
            "No shipping provider is configured. Set shipping.provider in "
            "Admin → Settings → Shipping."
        )

    def rate_quote(self, req: RateQuoteRequest) -> RateQuote:
        raise self._disabled()

    def create_shipment(self, req: ShipmentRequest) -> ShipmentResult:
        raise self._disabled()

    def schedule_pickup(self, req: PickupRequest) -> PickupResult:
        raise self._disabled()

    def label_pdf(self, awb_number: str) -> bytes:
        raise self._disabled()

    def fetch_tracking(self, awb_number: str) -> TrackingUpdate:
        raise self._disabled()

    def verify_webhook(self, body: bytes, signature: str | None) -> bool:
        return False

    def parse_webhook(self, body: bytes) -> TrackingUpdate:
        raise self._disabled()
