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

import json
from datetime import datetime, timezone
from decimal import Decimal

import httpx

from app.integrations.shipping.base import (
    PickupRequest,
    PickupResult,
    ProviderNotConfiguredError,
    RateQuote,
    RateQuoteRequest,
    ReverseShipmentRequest,
    ServiceabilityResult,
    ShipmentRequest,
    ShipmentResult,
    ShippingProviderError,
    TrackingEvent,
    TrackingStatus,
    TrackingUpdate,
)

logger = logging.getLogger(__name__)

_BASE_URLS: Final[dict[str, str]] = {
    "staging":    "https://staging-express.delhivery.com",
    "production": "https://track.delhivery.com",
}

# Delhivery's pincode endpoint is fast; tight timeout so we don't stall the
# customer-facing call when their API hiccups.
_REQUEST_TIMEOUT = httpx.Timeout(connect=5.0, read=8.0, write=5.0, pool=5.0)


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

    def _auth_headers(self) -> dict[str, str]:
        if not self.api_token:
            raise ProviderNotConfiguredError(
                "shipping.delhivery.api_token is empty. Set it in Admin → "
                "Settings → Shipping before using the Delhivery provider."
            )
        return {"Authorization": f"Token {self.api_token}"}

    def serviceability(self, pincode: str) -> ServiceabilityResult:
        """Delhivery B2C pincode serviceability.

        Docs: GET /c/api/pin-codes/json/?filter_codes=<pin>

        Empty `delivery_codes` => non-serviceable (NSZ).
        `remarks == "Embargo"` => temporarily non-serviceable (same UX as NSZ,
        different reason string).
        """
        url = f"{self.base_url}/c/api/pin-codes/json/"
        try:
            resp = httpx.get(
                url,
                params={"filter_codes": pincode},
                headers=self._auth_headers(),
                timeout=_REQUEST_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            logger.warning("delhivery serviceability network error: %s", exc)
            raise ShippingProviderError(
                "Could not reach Delhivery — please try again."
            ) from exc

        if resp.status_code == 401:
            raise ProviderNotConfiguredError(
                "Delhivery rejected the API token (401). Check "
                "shipping.delhivery.api_token in admin settings."
            )
        if resp.status_code >= 500:
            raise ShippingProviderError(
                f"Delhivery returned {resp.status_code} — please retry."
            )
        if resp.status_code >= 400:
            # Non-auth 4xx is usually a malformed pincode. Surface the body
            # so admins debugging in the network tab have the message.
            raise ShippingProviderError(
                f"Delhivery rejected the request ({resp.status_code}): "
                f"{resp.text[:200]}"
            )

        data = resp.json() or {}
        codes = data.get("delivery_codes") or []
        if not codes:
            return ServiceabilityResult(
                pincode=pincode,
                serviceable=False,
                remark="Outside Delhivery's delivery network.",
            )

        # Delhivery wraps the actual fields one level deep. Be defensive —
        # carriers love to add fields and shuffle nesting between versions.
        postal = codes[0].get("postal_code") or codes[0]
        remark = (postal.get("remarks") or "").strip()
        is_embargoed = remark.lower() == "embargo"
        return ServiceabilityResult(
            pincode=pincode,
            serviceable=not is_embargoed,
            cod_available=str(postal.get("cod", "N")).upper() == "Y",
            prepaid_available=str(postal.get("pre_paid", "Y")).upper() == "Y",
            remark=(f"Temporarily unavailable: {remark}" if is_embargoed
                    else None),
        )

    def rate_quote(self, req: RateQuoteRequest) -> RateQuote:
        """Delhivery shipping cost calculator.

        Docs: GET /api/kinko/v1/invoice/charges/.json
        Params:
          md   = E (express, the surface mode)
          ss   = Delivered
          o_pin / d_pin
          cgm  = chargeable weight in *grams*
          pt   = Pre-paid / COD
          cod  = cod_amount (paise)
        """
        if not req.origin_pincode:
            raise ProviderNotConfiguredError(
                "shipping.warehouse.pincode is empty — set the pickup pincode "
                "in Admin → Settings → Shipping."
            )
        total_grams = sum(
            (line.weight_grams or 200) * line.quantity for line in req.items
        )
        chargeable = max(total_grams, 500)
        params: dict[str, str | int] = {
            "md": "E",
            "ss": "Delivered",
            "o_pin": req.origin_pincode,
            "d_pin": req.destination_pincode,
            "cgm": chargeable,
            "pt": "COD" if req.cod_amount else "Pre-paid",
        }
        if req.cod_amount:
            params["cod"] = int(Decimal(req.cod_amount) * 100)

        url = f"{self.base_url}/api/kinko/v1/invoice/charges/.json"
        try:
            resp = httpx.get(
                url,
                params=params,
                headers=self._auth_headers(),
                timeout=_REQUEST_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            logger.warning("delhivery rate_quote network error: %s", exc)
            raise ShippingProviderError(
                "Could not reach Delhivery for a rate — please try again."
            ) from exc

        if resp.status_code == 401:
            raise ProviderNotConfiguredError(
                "Delhivery rejected the API token (401). Check "
                "shipping.delhivery.api_token in admin settings."
            )
        if resp.status_code >= 400:
            raise ShippingProviderError(
                f"Delhivery rejected the rate request ({resp.status_code}): "
                f"{resp.text[:200]}"
            )

        data = resp.json()
        # Delhivery returns a list; the first row is the chosen surface.
        entry = data[0] if isinstance(data, list) and data else data
        total = entry.get("total_amount") or entry.get("gross_amount") or 0
        try:
            amount = Decimal(str(total)).quantize(Decimal("1"))
        except Exception as exc:  # pragma: no cover — defensive
            raise ShippingProviderError(
                f"Delhivery returned an unparseable amount: {total!r}"
            ) from exc

        return RateQuote(
            amount=amount,
            chargeable_weight_grams=chargeable,
            breakdown=entry,
        )

    def create_shipment(self, req: ShipmentRequest) -> ShipmentResult:
        """Push a shipment to Delhivery.

        Docs: POST /api/cmu/create.json
        Content-Type: application/x-www-form-urlencoded
        Body shape (Delhivery's quirk — JSON wrapped in a form field):
            format=json&data=<urlencoded JSON>

        The JSON contains a `shipments` array and a `pickup_location` block.
        Required client name is added as `add_pickup_location.client`.
        """
        if not self.client_name:
            raise ProviderNotConfiguredError(
                "shipping.delhivery.client_name is empty. Set it in Admin → "
                "Settings → Shipping before creating shipments."
            )
        if not self.warehouse_name:
            raise ProviderNotConfiguredError(
                "shipping.warehouse.name is empty. Set the pickup warehouse "
                "(must match the one registered with Delhivery)."
            )

        total_grams = sum(
            (line.weight_grams or 200) * line.quantity for line in req.items
        )
        payload = {
            "shipments": [
                {
                    "name": req.consignee.name,
                    "add": req.consignee.address,
                    "pin": req.consignee.pincode,
                    "city": req.consignee.city or "",
                    "state": req.consignee.state or "",
                    "country": req.consignee.country,
                    "phone": req.consignee.phone,
                    "order": req.order_reference,
                    "payment_mode": req.payment_mode,
                    "total_amount": float(req.declared_value),
                    "cod_amount": float(req.cod_amount or 0),
                    "weight": total_grams,
                    "quantity": sum(i.quantity for i in req.items),
                    "products_desc": ", ".join(
                        f"#{i.product_id} x{i.quantity}" for i in req.items
                    )[:255],
                }
            ],
            "pickup_location": {
                "name": self.warehouse_name,
                "add": self.warehouse_address or "",
                "pin": self.warehouse_pincode or "",
                "city": "",
                "state": "",
                "country": "India",
                "phone": "",
            },
        }

        url = f"{self.base_url}/api/cmu/create.json"
        body = f"format=json&data={json.dumps(payload, separators=(',', ':'))}"
        try:
            resp = httpx.post(
                url,
                content=body,
                headers={
                    **self._auth_headers(),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                },
                timeout=_REQUEST_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            logger.warning("delhivery create_shipment network error: %s", exc)
            raise ShippingProviderError(
                "Could not reach Delhivery to create the shipment."
            ) from exc

        if resp.status_code == 401:
            raise ProviderNotConfiguredError(
                "Delhivery rejected the API token (401)."
            )
        if resp.status_code >= 400:
            raise ShippingProviderError(
                f"Delhivery rejected the shipment ({resp.status_code}): "
                f"{resp.text[:300]}"
            )

        data = resp.json()
        # Delhivery returns: {"success": true, "packages": [{"waybill": "...", "status": "Success", ...}]}
        if not data.get("success", False):
            # `rmk` / `remarks` field carries the rejection reason.
            rmk = (data.get("rmk") or data.get("remarks") or "unknown").strip()
            raise ShippingProviderError(f"Delhivery rejected: {rmk}")

        packages = data.get("packages") or []
        if not packages or not packages[0].get("waybill"):
            raise ShippingProviderError(
                "Delhivery accepted the call but returned no waybill."
            )
        first = packages[0]
        return ShipmentResult(
            awb_number=str(first["waybill"]),
            provider=self.name,
            # Delhivery doesn't return a label URL directly — fetched in phase 5.
            label_url=None,
            raw=data,
        )

    def create_reverse_shipment(self, req: ReverseShipmentRequest) -> ShipmentResult:
        """Mint a reverse waybill with Delhivery.

        Uses the same /api/cmu/create.json endpoint as forward shipments
        but with `payment_mode: 'Pickup'`. The `pickup_location` is the
        CUSTOMER (where the carrier collects from), and the consignee fields
        describe OUR warehouse (where it comes back to).
        """
        if not self.client_name:
            raise ProviderNotConfiguredError(
                "shipping.delhivery.client_name is empty."
            )
        if not self.warehouse_name:
            raise ProviderNotConfiguredError(
                "shipping.warehouse.name is empty."
            )

        total_grams = sum(
            (line.weight_grams or 200) * line.quantity for line in req.items
        )
        payload = {
            "shipments": [
                {
                    # Consignee fields name our warehouse on a reverse pickup —
                    # the carrier ships the parcel here.
                    "name": req.warehouse.name,
                    "add": req.warehouse.address,
                    "pin": req.warehouse.pincode,
                    "city": req.warehouse.city or "",
                    "state": req.warehouse.state or "",
                    "country": req.warehouse.country,
                    "phone": req.warehouse.phone,
                    "order": req.return_reference,
                    "payment_mode": "Pickup",     # Delhivery's reverse-shipment marker
                    "total_amount": float(req.declared_value),
                    "cod_amount": 0,
                    "weight": total_grams,
                    "quantity": sum(i.quantity for i in req.items),
                    "products_desc": ", ".join(
                        f"#{i.product_id} x{i.quantity}" for i in req.items
                    )[:255],
                    # Original waybill — handy for the carrier's audit trail.
                    "shipment_height": 0,
                    "shipment_width": 0,
                    "shipment_length": 0,
                }
            ],
            "pickup_location": {
                # On a reverse, this is the *customer*. Delhivery sends a
                # rider to this address to collect the parcel.
                "name": req.customer.name,
                "add": req.customer.address,
                "pin": req.customer.pincode,
                "city": req.customer.city or "",
                "state": req.customer.state or "",
                "country": req.customer.country,
                "phone": req.customer.phone,
            },
        }

        url = f"{self.base_url}/api/cmu/create.json"
        body = f"format=json&data={json.dumps(payload, separators=(',', ':'))}"
        try:
            resp = httpx.post(
                url,
                content=body,
                headers={
                    **self._auth_headers(),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                },
                timeout=_REQUEST_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            logger.warning("delhivery reverse create network error: %s", exc)
            raise ShippingProviderError(
                "Could not reach Delhivery to create the reverse pickup."
            ) from exc

        if resp.status_code == 401:
            raise ProviderNotConfiguredError(
                "Delhivery rejected the API token (401)."
            )
        if resp.status_code >= 400:
            raise ShippingProviderError(
                f"Delhivery rejected the reverse shipment ({resp.status_code}): "
                f"{resp.text[:300]}"
            )

        data = resp.json()
        if not data.get("success", False):
            rmk = (data.get("rmk") or data.get("remarks") or "unknown").strip()
            raise ShippingProviderError(f"Delhivery rejected: {rmk}")

        packages = data.get("packages") or []
        if not packages or not packages[0].get("waybill"):
            raise ShippingProviderError(
                "Delhivery accepted the call but returned no waybill."
            )
        return ShipmentResult(
            awb_number=str(packages[0]["waybill"]),
            provider=self.name,
            label_url=None,
            raw=data,
        )

    def schedule_pickup(self, req: PickupRequest) -> PickupResult:
        """Book a pickup window with Delhivery.

        Docs: POST /fm/request/new/
        Body is JSON: { pickup_location, pickup_date (YYYY-MM-DD),
                        pickup_time (HH:MM:SS), expected_package_count }
        """
        if not req.pickup_location_name:
            raise ProviderNotConfiguredError(
                "shipping.warehouse.name is empty."
            )
        body = {
            "pickup_location": req.pickup_location_name,
            "pickup_date": req.pickup_date.strftime("%Y-%m-%d"),
            "pickup_time": "10:00:00",  # Delhivery accepts any HH:MM:SS; mid-morning is the typical slot
            "expected_package_count": req.expected_package_count,
        }
        url = f"{self.base_url}/fm/request/new/"
        try:
            resp = httpx.post(
                url,
                json=body,
                headers={**self._auth_headers(), "Accept": "application/json"},
                timeout=_REQUEST_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            logger.warning("delhivery schedule_pickup network error: %s", exc)
            raise ShippingProviderError(
                "Could not reach Delhivery to schedule pickup."
            ) from exc

        if resp.status_code == 401:
            raise ProviderNotConfiguredError(
                "Delhivery rejected the API token (401)."
            )
        if resp.status_code >= 400:
            raise ShippingProviderError(
                f"Delhivery rejected the pickup request ({resp.status_code}): "
                f"{resp.text[:300]}"
            )

        data = resp.json() or {}
        pickup_id = (
            data.get("pickup_id")
            or data.get("pr_id")
            or data.get("request_id")
        )
        if not pickup_id:
            raise ShippingProviderError(
                "Delhivery accepted the call but returned no pickup id."
            )
        return PickupResult(
            pickup_id=str(pickup_id),
            scheduled_for=req.pickup_date,
            raw=data,
        )

    def label_pdf(self, awb_number: str) -> bytes:
        """Fetch the printable label PDF for an AWB.

        Docs: GET /api/p/packing_slip?wbns=<awb>&pdf=true
        Returns PDF bytes; some accounts return JSON wrapping a base64 PDF.
        We handle the bytes path here — JSON-base64 is a Phase-7-class
        polish if customers report it (logs will surface it).
        """
        url = f"{self.base_url}/api/p/packing_slip"
        try:
            resp = httpx.get(
                url,
                params={"wbns": awb_number, "pdf": "true"},
                headers=self._auth_headers(),
                timeout=_REQUEST_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            raise ShippingProviderError(
                "Could not reach Delhivery for the label."
            ) from exc

        if resp.status_code == 401:
            raise ProviderNotConfiguredError(
                "Delhivery rejected the API token (401)."
            )
        if resp.status_code >= 400:
            raise ShippingProviderError(
                f"Delhivery rejected the label request ({resp.status_code})."
            )
        # Sanity check the magic bytes so we don't return an HTML error page
        # masquerading as a PDF if the carrier mis-typed the response.
        body = resp.content
        if not body.startswith(b"%PDF-"):
            raise ShippingProviderError(
                "Delhivery returned a non-PDF response for the label."
            )
        return body

    def fetch_tracking(self, awb_number: str) -> TrackingUpdate:
        """Poll Delhivery for the current state of an AWB.

        Docs: GET /api/v1/packages/json?waybill=<awb>
        Response: { "ShipmentData": [{ "Shipment": { "Status": {...}, "Scans": [...]} }] }
        """
        url = f"{self.base_url}/api/v1/packages/json"
        try:
            resp = httpx.get(
                url,
                params={"waybill": awb_number},
                headers={**self._auth_headers(), "Accept": "application/json"},
                timeout=_REQUEST_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            raise ShippingProviderError(
                "Could not reach Delhivery to fetch tracking."
            ) from exc
        if resp.status_code == 401:
            raise ProviderNotConfiguredError("Delhivery rejected the API token (401).")
        if resp.status_code >= 400:
            raise ShippingProviderError(
                f"Delhivery rejected tracking request ({resp.status_code})."
            )
        data = resp.json() or {}
        shipments = data.get("ShipmentData") or []
        if not shipments:
            raise ShippingProviderError(f"AWB {awb_number} not found at Delhivery.")
        shipment = shipments[0].get("Shipment") or {}
        return _parse_delhivery_shipment(awb_number, shipment)

    def verify_webhook(self, body: bytes, signature: str | None) -> bool:
        """Delhivery doesn't sign webhook bodies — the shared-secret check on
        the query token is the auth gate, applied one layer up in the
        endpoint. We return True so anything that survived that gate is
        accepted at the provider layer."""
        return True

    def parse_webhook(self, body: bytes) -> TrackingUpdate:
        """Delhivery's webhook payload mirrors `ShipmentData[0].Shipment` from
        the tracking API. Some accounts also receive a flatter shape; we
        handle both.

        Common shape:
            {"Shipment": {"AWB": "...", "Status": {...}, "Scans": [...]}}
        Flat shape:
            {"AWB": "...", "Status": "Delivered", "StatusDateTime": "..."}
        """
        try:
            data = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ShippingProviderError(f"Bad webhook JSON: {exc}") from exc

        if isinstance(data, dict) and "Shipment" in data:
            shipment = data.get("Shipment") or {}
            awb = shipment.get("AWB") or shipment.get("Waybill") or ""
            return _parse_delhivery_shipment(awb, shipment)

        # Flat shape.
        awb = data.get("AWB") or data.get("waybill") or ""
        ts = _coerce_dt(data.get("StatusDateTime") or data.get("status_datetime"))
        return TrackingUpdate(
            awb_number=str(awb),
            status=_map_delhivery_status(data.get("Status") or data.get("status") or ""),
            occurred_at=ts,
            events=[],
        )


# ---- Delhivery parsing helpers --------------------------------------------


def _coerce_dt(value) -> datetime:
    """Parse Delhivery's various timestamp formats. Falls back to 'now' so
    a missing timestamp doesn't blow up the entire update — we just lose
    precision on dedup."""
    if not value:
        return datetime.now(timezone.utc)
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    s = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        # Carrier sometimes ships "DD-MM-YYYY HH:MM:SS"; try a couple of formats.
        for fmt in ("%d-%m-%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                continue
    return datetime.now(timezone.utc)


# Carrier status strings → our normalized enum. Strings are case-insensitive
# and matched on contains() so minor wording variations land correctly.
_STATUS_MAP: list[tuple[tuple[str, ...], TrackingStatus]] = [
    (("delivered",), TrackingStatus.DELIVERED),
    (("out for delivery", "ofd"), TrackingStatus.OUT_FOR_DELIVERY),
    (("rto", "returned"), TrackingStatus.RETURNED),
    (("picked", "pickup"), TrackingStatus.PICKED_UP),
    (("in transit", "dispatched", "manifested", "received at"), TrackingStatus.IN_TRANSIT),
    (("cancelled", "lost", "damaged"), TrackingStatus.CANCELLED),
    (("failed",), TrackingStatus.FAILED),
]


def _map_delhivery_status(text: str) -> TrackingStatus:
    lower = (text or "").strip().lower()
    for needles, mapped in _STATUS_MAP:
        if any(n in lower for n in needles):
            return mapped
    # Default to IN_TRANSIT — every event Delhivery sends is "the shipment
    # exists", and IN_TRANSIT is the safest non-terminal state.
    return TrackingStatus.IN_TRANSIT


def _parse_delhivery_shipment(awb: str, shipment: dict) -> TrackingUpdate:
    """Walks the nested `Shipment` object Delhivery returns and produces a
    normalized `TrackingUpdate` with the full scan history."""
    status_block = shipment.get("Status") or {}
    head_status_text = (
        status_block.get("Status") or shipment.get("status") or ""
    )
    head_occurred = _coerce_dt(
        status_block.get("StatusDateTime") or shipment.get("StatusDateTime")
    )

    events: list[TrackingEvent] = []
    for scan in shipment.get("Scans") or []:
        scan_detail = scan.get("ScanDetail") or scan
        events.append(
            TrackingEvent(
                status=_map_delhivery_status(scan_detail.get("Scan") or ""),
                occurred_at=_coerce_dt(scan_detail.get("ScanDateTime")),
                location=(scan_detail.get("ScannedLocation") or None),
                note=(scan_detail.get("Instructions") or None),
            )
        )

    return TrackingUpdate(
        awb_number=str(awb),
        status=_map_delhivery_status(head_status_text),
        occurred_at=head_occurred,
        events=events,
    )
