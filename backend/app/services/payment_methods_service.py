"""Payment-instrument catalog + per-instrument discount math.

The instrument list itself is hardcoded (UPI / Netbanking / Card / Wallet)
because adding a new rail requires a code change anyway — gateways, icons,
display copy. Per-instrument toggles + discount percents live in settings
so the admin can tune them without a deploy.

Two read paths:

  1. `list_instruments()`  → flat list for the /payments/instruments
     endpoint. Honors `enabled` + `suggested_instrument`.
  2. `discount_for(instrument, base)`  → Decimal subtraction applied at
     order build time. Caps at the base value so a misconfigured 200%
     discount can't produce a negative total.
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import Final

from sqlalchemy.orm import Session

from app.schemas.payment_instruments import PaymentInstrumentItem
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)


_CATALOG: Final[list[dict]] = [
    {
        "code": "upi",
        "label": "Pay via UPI",
        "description": "PhonePe, Google Pay, Paytm, BHIM & other UPI apps",
    },
    {
        "code": "netbanking",
        "label": "Netbanking",
        "description": "All major Indian banks",
    },
    {
        "code": "card",
        "label": "Debit / Credit cards",
        "description": "Visa, Mastercard, RuPay & more",
    },
    {
        "code": "wallet",
        "label": "Wallets",
        "description": "Paytm, MobiKwik, Amazon Pay & more",
    },
]

_VALID_CODES: Final[set[str]] = {entry["code"] for entry in _CATALOG}


class PaymentMethodsService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = SettingsService(db)

    def is_valid_instrument(self, code: str | None) -> bool:
        return code in _VALID_CODES

    def list_instruments(self) -> list[PaymentInstrumentItem]:
        suggested = (
            self.settings.get_raw("payments.suggested_instrument") or "upi"
        ).strip().lower()
        items: list[PaymentInstrumentItem] = []
        for entry in _CATALOG:
            code = entry["code"]
            enabled = self.settings.get_bool(
                f"payments.instruments.{code}.enabled", default=True
            )
            disc = self._discount_percent(code)
            items.append(
                PaymentInstrumentItem(
                    code=code,
                    label=entry["label"],
                    description=entry["description"],
                    enabled=enabled,
                    discount_percent=disc,
                    suggested=(code == suggested),
                )
            )
        return items

    def is_enabled(self, code: str | None) -> bool:
        if not code or code not in _VALID_CODES:
            return False
        return self.settings.get_bool(
            f"payments.instruments.{code}.enabled", default=True
        )

    def discount_for(self, instrument: str | None, base: Decimal) -> Decimal:
        """Returns the absolute discount amount in ₹ for the chosen
        instrument, given the *base* it applies to (typically the order
        subtotal + tax, before shipping + coupon). Quantized to 2dp.

        Guards: unknown / disabled instrument => 0; cap at `base` so a
        broken 200% setting can't drive the total negative.
        """
        if not instrument or instrument not in _VALID_CODES:
            return Decimal("0.00")
        if not self.is_enabled(instrument):
            return Decimal("0.00")
        pct = self._discount_percent(instrument)
        if pct <= 0:
            return Decimal("0.00")
        amount = (Decimal(base) * pct / Decimal(100)).quantize(Decimal("0.01"))
        if amount > Decimal(base):
            amount = Decimal(base).quantize(Decimal("0.01"))
        return amount

    # ---- internals --------------------------------------------------------

    def _discount_percent(self, code: str) -> Decimal:
        raw = self.settings.get_raw(
            f"payments.instruments.{code}.discount_percent"
        ) or "0"
        try:
            return Decimal(raw)
        except Exception:  # noqa: BLE001 — bad admin input falls back to 0
            logger.warning(
                "invalid discount_percent for %s: %r — using 0", code, raw
            )
            return Decimal("0")
