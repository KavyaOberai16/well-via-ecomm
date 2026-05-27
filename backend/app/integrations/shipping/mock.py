"""In-process mock shipping provider.

Used when `shipping.provider=mock` so the entire shipping flow works end-to-end
without hitting any carrier — useful for local dev, CI, and demoing the
admin UI before credentials are in place.

The mock is deterministic so tests can assert on its output:

- Serviceability: every pincode is serviceable EXCEPT those starting with "999"
  (reserved as "obviously unreachable" for negative-path tests).
- Rate: flat ₹50 + ₹0.05 per gram chargeable weight, min 500g, rounded to ₹1.
- AWB: "MOCK<order_id>-<random-6>" so it's grep-able in logs.
- Tracking: returns the synthetic event list we store in Redis (the simulator
  can write to it from the admin UI in phase 6).
"""
from __future__ import annotations

import hashlib
import json
import logging
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

import redis

from app.integrations.shipping.base import (
    PickupRequest,
    PickupResult,
    RateQuote,
    RateQuoteRequest,
    ServiceabilityResult,
    ShipmentRequest,
    ShipmentResult,
    ShippingProviderError,
    TrackingEvent,
    TrackingStatus,
    TrackingUpdate,
)

logger = logging.getLogger(__name__)

_REDIS_KEY_PREFIX = "shipping:mock:awb"
_TRACKING_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days


def _quantize(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("1"))


class MockShippingProvider:
    name = "mock"

    def __init__(self, redis_url: str):
        self._redis = redis.Redis.from_url(redis_url, decode_responses=True)

    # ---- pincodes ----

    def serviceability(self, pincode: str) -> ServiceabilityResult:
        if not pincode or not pincode.strip().isdigit():
            raise ShippingProviderError("Pincode must be numeric.")
        clean = pincode.strip()
        if clean.startswith("999"):
            return ServiceabilityResult(
                pincode=clean,
                serviceable=False,
                remark="Outside our delivery network (mock).",
            )
        # Synthesize an ETA from a hash so the same pincode returns the same
        # number every time — useful for screenshots and snapshot tests.
        h = int(hashlib.sha1(clean.encode()).hexdigest(), 16)
        eta_min = 1 + (h % 3)        # 1..3 days
        eta_max = eta_min + 2        # +2 days
        cod = (h % 5) != 0           # 80% of pincodes get COD
        return ServiceabilityResult(
            pincode=clean,
            serviceable=True,
            cod_available=cod,
            prepaid_available=True,
            eta_days_min=eta_min,
            eta_days_max=eta_max,
        )

    # ---- rate ----

    def rate_quote(self, req: RateQuoteRequest) -> RateQuote:
        # Total billable weight: sum of declared weights, fallback 200g/item.
        total_grams = sum(
            (line.weight_grams or 200) * line.quantity for line in req.items
        )
        chargeable = max(total_grams, 500)  # min slab
        amount = Decimal("50") + (Decimal(chargeable) * Decimal("0.05"))
        return RateQuote(
            amount=_quantize(amount),
            chargeable_weight_grams=chargeable,
            breakdown={
                "base": "50",
                "weight_charge": str(_quantize(Decimal(chargeable) * Decimal("0.05"))),
                "chargeable_weight_grams": chargeable,
            },
        )

    # ---- shipment ----

    def create_shipment(self, req: ShipmentRequest) -> ShipmentResult:
        awb = f"MOCK{req.order_id}-{secrets.token_hex(3).upper()}"
        # Seed an initial CREATED event so /tracking has something to return
        # before anyone simulates further status changes.
        now = datetime.now(timezone.utc).isoformat()
        try:
            self._redis.setex(
                f"{_REDIS_KEY_PREFIX}:{awb}",
                _TRACKING_TTL_SECONDS,
                json.dumps({
                    "status": TrackingStatus.CREATED.value,
                    "occurred_at": now,
                    "events": [
                        {"status": TrackingStatus.CREATED.value, "occurred_at": now,
                         "location": req.pickup.city, "note": "Shipment created (mock)"}
                    ],
                }),
            )
        except redis.RedisError as exc:
            logger.warning("mock shipping redis seed failed: %s", exc)
        return ShipmentResult(
            awb_number=awb,
            provider=self.name,
            label_url=None,
            raw={"echo": {"order_id": req.order_id, "to": req.consignee.pincode}},
        )

    # ---- pickup ----

    def schedule_pickup(self, req: PickupRequest) -> PickupResult:
        return PickupResult(
            pickup_id=f"MOCKPUP-{secrets.token_hex(4).upper()}",
            scheduled_for=req.pickup_date,
            raw={"echo": req.__dict__},
        )

    # ---- label ----

    def label_pdf(self, awb_number: str) -> bytes:
        # A truly minimal PDF blob ("Hello, world!" PDF) so admins can verify
        # the download path without needing reportlab in the dev image.
        return (
            b"%PDF-1.1\n%\xe2\xe3\xcf\xd3\n"
            b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
            b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]"
            b"/Contents 4 0 R/Resources<<>>>>endobj\n"
            b"4 0 obj<</Length 70>>stream\nBT /F1 12 Tf 10 50 Td "
            + f"(MOCK LABEL {awb_number}) Tj ET\n".encode()
            + b"endstream endobj\n"
            b"xref\n0 5\n0000000000 65535 f\n"
            b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n200\n%%EOF\n"
        )

    # ---- tracking ----

    def fetch_tracking(self, awb_number: str) -> TrackingUpdate:
        raw = self._redis.get(f"{_REDIS_KEY_PREFIX}:{awb_number}")
        if raw is None:
            raise ShippingProviderError(f"AWB {awb_number} not found in mock store.")
        data = json.loads(raw)
        return TrackingUpdate(
            awb_number=awb_number,
            status=TrackingStatus(data["status"]),
            occurred_at=datetime.fromisoformat(data["occurred_at"]),
            events=[
                TrackingEvent(
                    status=TrackingStatus(e["status"]),
                    occurred_at=datetime.fromisoformat(e["occurred_at"]),
                    location=e.get("location"),
                    note=e.get("note"),
                )
                for e in data.get("events", [])
            ],
        )

    def verify_webhook(self, body: bytes, signature: str | None) -> bool:
        # Mock webhooks are accepted as-is — they never traverse the network
        # so spoofing isn't a concern. The shared-secret check is exercised
        # by the Delhivery provider.
        return True

    def parse_webhook(self, body: bytes) -> TrackingUpdate:
        data = json.loads(body)
        return TrackingUpdate(
            awb_number=data["awb_number"],
            status=TrackingStatus(data["status"]),
            occurred_at=datetime.fromisoformat(data["occurred_at"]),
        )

    # ---- mock-only helper for phase 6 simulator ----

    def push_status(
        self,
        awb_number: str,
        status: TrackingStatus,
        *,
        note: Optional[str] = None,
    ) -> None:
        """Dev affordance — flips a mock AWB to a new status, appending the
        event history. Lets us walk the admin UI through SHIPPED→DELIVERED
        without writing a fake webhook poster."""
        key = f"{_REDIS_KEY_PREFIX}:{awb_number}"
        raw = self._redis.get(key)
        data = json.loads(raw) if raw else {"events": []}
        now = datetime.now(timezone.utc).isoformat()
        data["status"] = status.value
        data["occurred_at"] = now
        data["events"].append({
            "status": status.value,
            "occurred_at": now,
            "note": note or status.value,
        })
        self._redis.setex(key, _TRACKING_TTL_SECONDS, json.dumps(data))
