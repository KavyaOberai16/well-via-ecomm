"""Shipping provider contract.

A shipping provider knows how to:
  1. `serviceability(pincode)` — can we ship there? + ETA + cash-on-delivery
     availability. Powers the cart "we don't ship to your area" gate.
  2. `rate_quote(req)` — what does it cost to deliver a given cart to a given
     pincode? Drives the shipping line on the order total.
  3. `create_shipment(req)` — push a paid order to the carrier; get back a
     waybill (AWB) number we attach to the order.
  4. `schedule_pickup(req)` — book the courier to pick up from our warehouse.
  5. `label_pdf(awb)` — fetch a printable label as raw bytes.
  6. `fetch_tracking(awb)` — current status history (used as a fallback poll
     when webhooks haven't arrived).
  7. `verify_webhook` / `parse_webhook` — accept the carrier's push notification
     and turn it into a `TrackingUpdate`.

The waybill / AWB number is the *carrier's* identifier; the merchant order id
remains ours. We persist both — `orders.shipping_awb` is the AWB column added
in phase 4.

This file ships the abstraction only — concrete carriers live in sibling
modules (`mock.py`, `delhivery.py`, `none.py`). Adding a new carrier (FedEx,
Bluedart, etc.) means writing a new module that implements this Protocol;
nothing else needs to change.
"""
from __future__ import annotations

import enum
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Protocol


class TrackingStatus(str, enum.Enum):
    """Normalized status used by our order state machine. Each carrier maps
    its own status vocabulary into one of these — callers never branch on
    carrier-specific strings."""

    CREATED = "created"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"           # delivery attempt failed (NDR)
    RETURNED = "returned"       # RTO — returned to origin
    CANCELLED = "cancelled"


@dataclass
class ServiceabilityResult:
    pincode: str
    serviceable: bool
    cod_available: bool = False
    prepaid_available: bool = True
    # Display-friendly note when not serviceable — e.g. "Embargo until 2026-06-01",
    # "Outside delivery network". UI surfaces this verbatim.
    remark: str | None = None
    # Best-effort ETA in days. None when the carrier doesn't return one.
    eta_days_min: int | None = None
    eta_days_max: int | None = None


@dataclass
class CartLine:
    """Slim payload for rate quotes — we don't pass full ORM objects into the
    integration layer because that would tie shipping to our schema."""

    product_id: int
    quantity: int
    unit_price: Decimal
    # Weight + dims default to None and we use config-driven fallbacks; most
    # storefronts don't capture per-SKU weight on day one.
    weight_grams: int | None = None
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None


@dataclass
class RateQuoteRequest:
    origin_pincode: str
    destination_pincode: str
    items: list[CartLine]
    cod_amount: Decimal | None = None  # None = prepaid


@dataclass
class RateQuote:
    amount: Decimal              # what we charge the customer (INR)
    chargeable_weight_grams: int
    breakdown: dict | None = None  # raw fees for debugging, optional


@dataclass
class ShipmentAddress:
    name: str
    phone: str
    pincode: str
    address: str
    city: str | None = None
    state: str | None = None
    country: str = "India"
    email: str | None = None


@dataclass
class ShipmentRequest:
    order_id: int
    order_reference: str             # what we show on the label (e.g. "ORD11")
    consignee: ShipmentAddress
    pickup: ShipmentAddress
    items: list[CartLine]
    declared_value: Decimal          # for insurance + customs
    cod_amount: Decimal | None = None
    payment_mode: str = "Prepaid"    # "Prepaid" or "COD"


@dataclass
class ReverseShipmentRequest:
    """Reverse pickup — picking the package up from the customer and
    bringing it back to our warehouse. `consignee` is OUR warehouse;
    `pickup` is the customer's address. Distinct dataclass (rather than
    reusing ShipmentRequest with a flag) so each field clearly names what
    it represents."""

    return_id: int
    return_reference: str             # printed on the reverse label
    customer: ShipmentAddress         # where the carrier picks up from
    warehouse: ShipmentAddress        # where the parcel comes back to
    items: list[CartLine]
    declared_value: Decimal           # what we're refunding — keeps insurance honest
    original_awb: str | None = None   # forward AWB for cross-reference


@dataclass
class ShipmentResult:
    awb_number: str
    provider: str
    label_url: str | None = None     # carrier-hosted PDF
    raw: dict | None = None


@dataclass
class PickupRequest:
    pickup_location_name: str        # must be pre-registered with the carrier
    pickup_date: datetime
    expected_package_count: int = 1


@dataclass
class PickupResult:
    pickup_id: str
    scheduled_for: datetime
    raw: dict | None = None


@dataclass
class TrackingEvent:
    status: TrackingStatus
    occurred_at: datetime
    location: str | None = None
    note: str | None = None


@dataclass
class TrackingUpdate:
    """The carrier-pushed (webhook) or polled current state of a shipment."""

    awb_number: str
    status: TrackingStatus
    occurred_at: datetime
    events: list[TrackingEvent] = field(default_factory=list)


class ShippingProviderError(Exception):
    """Raised by providers for anything the caller might want to surface to
    the admin — bad config, carrier-side rejection, network error. The service
    layer catches this and converts it to AppError so the admin sees the
    actual message."""


class ProviderNotConfiguredError(ShippingProviderError):
    """Specifically: admin hasn't filled in the credentials yet."""


class ShippingProvider(Protocol):
    """Minimal surface area; concrete classes may add helpers. Anything that
    talks to a carrier must live in a class that satisfies this Protocol."""

    name: str

    def serviceability(self, pincode: str) -> ServiceabilityResult: ...
    def rate_quote(self, req: RateQuoteRequest) -> RateQuote: ...
    def create_shipment(self, req: ShipmentRequest) -> ShipmentResult: ...
    def create_reverse_shipment(self, req: ReverseShipmentRequest) -> ShipmentResult: ...
    def schedule_pickup(self, req: PickupRequest) -> PickupResult: ...
    def label_pdf(self, awb_number: str) -> bytes: ...
    def fetch_tracking(self, awb_number: str) -> TrackingUpdate: ...

    def verify_webhook(self, body: bytes, signature: str | None) -> bool: ...
    def parse_webhook(self, body: bytes) -> TrackingUpdate: ...
