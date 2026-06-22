"""Cash-on-Delivery business rules.

`check_availability` runs an ordered chain of gates. Each gate may
contribute one or more reasons to the reject list; the response surfaces
*all* failed reasons (not just the first) so the customer sees the full
picture at the checkout picker.

Gate order is stable so logs and tests are reproducible:

  1. Global kill switch          (`cod.enabled=false`)
  2. Per-product block           (any item with `cod_blocked=true`)
  3. Cart subtotal bounds        (`cod.min_order_total`, `cod.max_order_total`)
  4. Carrier serviceability      (pincode-level COD permission)
  5. First-time customer rule    (`cod.block_first_time_customer`)
  6. RTO-history rule            (`cod.block_rto_customers`)

The `surcharge_amount` and `cod_total` fields are populated for every
response — even when not available — so the UI can render a comparison
("if it were available it'd be …") without a second request.
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.integrations.shipping import ShippingProviderError
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.return_request import ReturnRequest, ReturnStatus
from app.models.user import User
from app.services.settings_service import SettingsService
from app.services.shipping_service import ShippingService
from app.services.tax_service import compute_line_tax, quantize_money

logger = logging.getLogger(__name__)


class CodAvailability:
    """Plain container for the gate-chain result. Used internally; the API
    returns a Pydantic model derived from this."""

    def __init__(self) -> None:
        self.available: bool = True
        self.reasons: list[str] = []
        self.surcharge_amount: Decimal = Decimal("0")
        self.subtotal: Decimal = Decimal("0")
        self.tax_amount: Decimal = Decimal("0")
        self.shipping_amount: Decimal = Decimal("0")
        # `cod_total` = grand total the customer pays on delivery. Computed
        # by callers that know the discount + shipping; we leave it None
        # here so the checkout-side recompute (with coupon + shipping) is
        # the source of truth at order build time.

    def deny(self, reason: str) -> None:
        self.available = False
        self.reasons.append(reason)


class CodService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = SettingsService(db)

    # ---- public ------------------------------------------------------------

    def check_availability(
        self,
        *,
        user: User | None,
        cart_items: list[tuple[int, int]],   # [(product_id, qty), ...]
        destination_pincode: str | None,
    ) -> CodAvailability:
        result = CodAvailability()
        # Resolve products up front — we need them for cart math and the
        # per-product block check.
        products = self._resolve_products([pid for pid, _ in cart_items])

        # Gate 1 — global kill switch.
        if not self.settings.get_bool("cod.enabled", default=True):
            result.deny("Cash on Delivery is currently disabled.")

        # Gate 2 — per-product block.
        blocked = [p.name for pid, _ in cart_items if (p := products.get(pid)) and p.cod_blocked]
        if blocked:
            # Surface up to 3 names verbatim, then "and N more" — keeps the
            # toast short on long carts.
            preview = ", ".join(blocked[:3])
            tail = f" and {len(blocked) - 3} more" if len(blocked) > 3 else ""
            result.deny(f"{preview}{tail} can't be paid for on delivery.")

        # Math — needed for the bounds check and for displaying the total.
        subtotal, tax_amount = self._compute_subtotal_and_tax(cart_items, products)
        result.subtotal = subtotal
        result.tax_amount = tax_amount

        min_total = Decimal(str(self.settings.get_int("cod.min_order_total", default=0)))
        max_total = Decimal(str(self.settings.get_int("cod.max_order_total", default=0)))

        # Gate 3 — bounds. 0 means "no limit" for both ends.
        if min_total > 0 and subtotal < min_total:
            result.deny(
                f"COD only available for orders of ₹{min_total} or more."
            )
        if max_total > 0 and subtotal > max_total:
            result.deny(
                f"COD only available for orders up to ₹{max_total}."
            )

        # Gate 4 — carrier serviceability for the pincode.
        if destination_pincode:
            try:
                serv = ShippingService(self.db).serviceability(destination_pincode)
                if not serv.cod_available and serv.serviceable:
                    result.deny(
                        f"Our carrier doesn't offer COD to pincode {serv.pincode}."
                    )
            except ShippingProviderError as exc:
                # Don't block on a flaky carrier — log + treat as "unknown".
                logger.warning(
                    "cod check: serviceability lookup failed for %s: %s",
                    destination_pincode, exc,
                )

        # Gates 5 & 6 — user-specific. Skip when anonymous.
        if user is not None:
            if self.settings.get_bool("cod.block_first_time_customer", default=False):
                if self._is_first_time_customer(user.id):
                    result.deny(
                        "COD isn't available on your first order — try UPI "
                        "or cards instead."
                    )
            if self.settings.get_bool("cod.block_rto_customers", default=False):
                if self._has_refunded_returns(user.id):
                    result.deny(
                        "COD isn't available on this account based on prior "
                        "returns. Online payment is required."
                    )

        # Surcharge — same whether or not the order is actually available,
        # so the UI can show "₹40 COD fee" on the disabled card too.
        result.surcharge_amount = self._surcharge()
        return result

    def surcharge_amount(self) -> Decimal:
        """Convenience used by PaymentService at order-build time."""
        return self._surcharge()

    # ---- Split COD --------------------------------------------------------

    def split_prepaid_for(self, order_total: Decimal) -> Decimal:
        """Returns the upfront-prepaid portion for a Split COD order.

        Capped at the order total so an admin who sets `split_prepaid_amount`
        higher than the cart total doesn't end up over-charging — we
        silently fall back to the order total (which makes the carrier's
        COD leg zero, i.e. degenerate to full prepaid).
        """
        raw = self.settings.get_raw("cod.split_prepaid_amount") or "0"
        try:
            cfg = Decimal(raw)
        except Exception:  # noqa: BLE001
            logger.warning("invalid cod.split_prepaid_amount %r — using 0", raw)
            cfg = Decimal("0")
        if cfg <= 0:
            return Decimal("0")
        return min(cfg, Decimal(order_total)).quantize(Decimal("0.01"))

    def split_availability(
        self,
        availability: "CodAvailability",
        order_total: Decimal,
    ) -> tuple[bool, Decimal, Decimal]:
        """Compute (available, prepaid_portion, cod_balance) for Split COD.

        Inherits the full-COD gate chain (passed in as `availability`) plus
        the dedicated `cod.split_enabled` toggle and a non-degenerate
        prepaid portion. Returns (False, 0, 0) when Split COD shouldn't be
        offered.
        """
        if not availability.available:
            return False, Decimal("0"), Decimal("0")
        if not self.settings.get_bool("cod.split_enabled", default=False):
            return False, Decimal("0"), Decimal("0")
        prepaid = self.split_prepaid_for(order_total)
        # Degenerate cases: prepaid == 0 (= full COD) or prepaid >= total
        # (= full prepaid). Either way, hide Split COD from the picker so
        # we don't surface a no-op option.
        if prepaid <= 0 or prepaid >= Decimal(order_total):
            return False, Decimal("0"), Decimal("0")
        balance = (Decimal(order_total) - prepaid).quantize(Decimal("0.01"))
        return True, prepaid, balance

    # ---- internals ---------------------------------------------------------

    def _surcharge(self) -> Decimal:
        # Flat-only in v1; percent surcharge intentionally not implemented
        # (decision: flat is predictable, no quantization edge cases).
        raw = self.settings.get_raw("cod.flat_surcharge") or "0"
        try:
            return Decimal(raw).quantize(Decimal("0.01"))
        except Exception:  # noqa: BLE001 — bad admin input falls back to 0
            logger.warning("invalid cod.flat_surcharge value %r — treating as 0", raw)
            return Decimal("0.00")

    def _resolve_products(self, product_ids: Sequence[int]) -> dict[int, Product]:
        if not product_ids:
            return {}
        stmt = select(Product).where(Product.id.in_(set(product_ids)))
        return {p.id: p for p in self.db.execute(stmt).scalars().all()}

    def _compute_subtotal_and_tax(
        self,
        cart_items: list[tuple[int, int]],
        products: dict[int, Product],
    ) -> tuple[Decimal, Decimal]:
        subtotal = Decimal("0.00")
        tax = Decimal("0.00")
        for pid, qty in cart_items:
            p = products.get(pid)
            if not p:
                raise NotFoundError(f"Product {pid} not found")
            subtotal += quantize_money(Decimal(p.price) * qty)
            tax += compute_line_tax(Decimal(p.price), qty, list(p.taxes))
        return subtotal, tax

    def _is_first_time_customer(self, user_id: int) -> bool:
        """True when this user has no prior orders in a "really happened"
        state. PENDING/CANCELLED don't count — abandoned carts shouldn't
        burn a customer's "first-order" benefit."""
        committed_states = (
            OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED,
        )
        stmt = (
            select(func.count(Order.id))
            .where(
                Order.user_id == user_id,
                Order.status.in_(committed_states),
            )
        )
        count = self.db.execute(stmt).scalar_one()
        return (count or 0) == 0

    def _has_refunded_returns(self, user_id: int) -> bool:
        stmt = (
            select(func.count(ReturnRequest.id))
            .where(
                ReturnRequest.user_id == user_id,
                ReturnRequest.status == ReturnStatus.REFUNDED,
            )
        )
        return (self.db.execute(stmt).scalar_one() or 0) > 0
