"""Orchestrates the order + payment lifecycle.

`checkout` builds a PENDING order (reserving stock) and asks the active
provider for a redirect URL. The order's `payment_intent_id` becomes the
merchant transaction id we share with the provider; later webhook / status
calls look the order back up by that column.

State transitions are intentionally narrow:
  PENDING --(payment succeeds)--> PAID
  PENDING --(payment fails or user cancels)--> CANCELLED
Re-running a webhook on an order that's already terminal is a no-op.
"""
from __future__ import annotations

import logging
import secrets
from decimal import Decimal
from typing import Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.integrations.payments import (
    InitiateRequest,
    PaymentStatus,
    get_payment_provider,
)
from app.models.coupon import Coupon
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.repositories.coupon_repository import CouponRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.payment import CheckoutRequest
from app.services.cart_service import CartService
from app.services.coupon_service import CouponService
from app.services.tax_service import compute_line_tax, quantize_money

logger = logging.getLogger(__name__)


def _new_mtid() -> str:
    # PhonePe limits merchantTransactionId to <=35 alphanumerics — pad ours
    # with a short prefix so it's recognizable in logs.
    return f"ORD{secrets.token_hex(12).upper()}"  # 27 chars


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)
        self.products = ProductRepository(db)
        self.cart = CartService(db)
        self.coupons = CouponRepository(db)
        self.provider = get_payment_provider()

    # ---- public ----

    def checkout(self, user: User, data: CheckoutRequest) -> Tuple[Order, str, str]:
        """Create a PENDING order + initiate payment. Returns (order, mtid, redirect_url)."""
        order, total = self._build_order(user.id, data)
        mtid = _new_mtid()
        order.payment_intent_id = mtid
        self.orders.add(order)
        # flush so the order has an id we can pass to the provider, but don't
        # commit until we know we'll keep this row.
        self.db.flush()

        currency = (data.currency or order.currency or "INR").upper()
        order.currency = currency
        amount_minor = int((total * 100).to_integral_value())

        try:
            initiate = self.provider.initiate(
                InitiateRequest(
                    order_id=order.id,
                    user_id=user.id,
                    amount_minor=amount_minor,
                    currency=currency,
                    merchant_transaction_id=mtid,
                    return_url=f"{settings.PAYMENT_RETURN_URL}?mtid={mtid}",
                    user_email=user.email,
                )
            )
        except Exception:
            # The provider failed *before* we committed. Roll back the
            # reserved stock so the customer can retry without losing units.
            self.db.rollback()
            raise

        self.db.commit()
        self.db.refresh(order)
        logger.info(
            "checkout user=%s order=%s mtid=%s provider=%s",
            user.id,
            order.id,
            mtid,
            self.provider.name,
        )
        return order, mtid, initiate.redirect_url

    def handle_webhook(self, body: bytes, signature: str | None) -> Order:
        if not self.provider.verify_webhook(body, signature):
            raise ForbiddenError("Invalid payment signature.")
        result = self.provider.parse_webhook(body)
        order = self._order_for_mtid(result.merchant_transaction_id)
        self._apply_status(order, result.status)
        return order

    def get_status(self, user_id: int, merchant_transaction_id: str) -> Order:
        order = self._order_for_mtid(merchant_transaction_id)
        if order.user_id != user_id:
            raise NotFoundError("Order not found")
        # If the order is still PENDING, poll the provider — covers cases
        # where the webhook hasn't landed yet (the user beat it back to us).
        if order.status == OrderStatus.PENDING:
            try:
                result = self.provider.fetch_status(merchant_transaction_id)
                if result.status != PaymentStatus.PENDING:
                    self._apply_status(order, result.status)
            except Exception as exc:  # don't fail the poll on a flaky provider
                logger.warning("status check failed for %s: %s", merchant_transaction_id, exc)
        return order

    def mark_mock_decision(self, mtid: str, action: str) -> Order:
        """Dev-only — drives the mock simulator without going through the
        signed-webhook path. Reuses the same `_apply_status` so behavior is
        identical to the real path."""
        if self.provider.name != "mock":
            raise ForbiddenError("Mock decisions are disabled.")
        status_ = PaymentStatus.SUCCESS if action == "approve" else PaymentStatus.FAILED
        # Also persist the decision in Redis so a status poll matches.
        body = f'{{"merchant_transaction_id":"{mtid}","action":"{action}"}}'.encode()
        self.provider.parse_webhook(body)
        order = self._order_for_mtid(mtid)
        self._apply_status(order, status_)
        return order

    # ---- internals ----

    def _build_order(self, user_id: int, data: CheckoutRequest) -> tuple[Order, Decimal]:
        order = Order(user_id=user_id, shipping_address=data.shipping_address)
        subtotal = Decimal("0.00")
        tax_amount = Decimal("0.00")
        for line in data.items:
            product = self.products.get(line.product_id)
            if not product:
                raise NotFoundError(f"Product {line.product_id} not found")
            if product.stock < line.quantity:
                raise ConflictError(f"Insufficient stock for {product.sku}")
            self.products.decrement_stock(product, line.quantity)
            order.items.append(
                OrderItem(
                    product_id=product.id,
                    quantity=line.quantity,
                    unit_price=product.price,
                )
            )
            subtotal += quantize_money(product.price * line.quantity)
            tax_amount += compute_line_tax(product.price, line.quantity, list(product.taxes))

        discount_amount = Decimal("0.00")
        coupon_code: str | None = None
        if data.coupon_code:
            # Validate raises ValidationError if expired / exhausted / below min.
            coupon, discount_amount = CouponService(self.db).validate(
                data.coupon_code.strip().upper(), user_id, subtotal
            )
            coupon_code = coupon.code

        total = quantize_money(subtotal + tax_amount - discount_amount)
        order.subtotal = subtotal
        order.tax_amount = tax_amount
        order.discount_amount = discount_amount
        order.coupon_code = coupon_code
        order.total_amount = total
        order.status = OrderStatus.PENDING
        return order, total

    def _order_for_mtid(self, mtid: str) -> Order:
        stmt = select(Order).where(Order.payment_intent_id == mtid)
        order = self.db.execute(stmt).scalar_one_or_none()
        if not order:
            raise NotFoundError("Order not found for transaction.")
        return order

    def _apply_status(self, order: Order, payment_status: PaymentStatus) -> None:
        # Idempotent: only PENDING orders move. Webhooks can fire twice.
        if order.status != OrderStatus.PENDING:
            return
        notify_paid = False
        if payment_status == PaymentStatus.SUCCESS:
            order.status = OrderStatus.PAID
            from datetime import datetime, timezone

            order.paid_at = datetime.now(timezone.utc)
            self._record_coupon_usage(order)
            self._award_loyalty_points(order)
            self._complete_referral(order)
            self._clear_cart(order.user_id)
            notify_paid = True
        elif payment_status == PaymentStatus.FAILED:
            order.status = OrderStatus.CANCELLED
            self._restore_stock(order)
        # PENDING -> no change.
        self.db.commit()

        # Notifications go AFTER commit so the customer never gets a
        # "your order is paid" email for a row that didn't actually save.
        if notify_paid:
            self._send_notification(order, "order_paid")

    def _send_notification(self, order: Order, event_name: str) -> None:
        """Fan out to email + SMS. Wrapped so a flaky downstream never breaks
        the payment commit."""
        from app.services.notifications import NotificationEvent, NotificationService

        try:
            NotificationService(self.db).notify(order, NotificationEvent(event_name))
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "notification dispatch failed for order %s event %s: %s",
                order.id,
                event_name,
                exc,
            )

    def _award_loyalty_points(self, order: Order) -> None:
        """Award purchase points after payment succeeds. Idempotent via the
        unique (reason, ref_type, ref_id) index — webhook re-runs are safe."""
        # Lazy import to keep loyalty optional / avoid a cycle.
        from app.services.loyalty_service import LoyaltyService

        try:
            LoyaltyService(self.db).award_for_order(order)
        except Exception as exc:
            # Never fail the payment commit on a points hiccup. The reconcile
            # script can backfill if anything was missed.
            logger.warning(
                "loyalty award failed for order %s: %s", order.id, exc
            )

    def _complete_referral(self, order: Order) -> None:
        """If this order's user was referred, complete the referral and mint
        the referrer's reward coupon. Idempotent — only PENDING referrals move,
        so re-running the webhook is safe."""
        from app.services.referral_service import ReferralService

        try:
            ReferralService(self.db).complete_referral_for_user(order.user_id, order.id)
        except Exception as exc:
            logger.warning(
                "referral completion failed for order %s: %s", order.id, exc
            )

    def _record_coupon_usage(self, order: Order) -> None:
        if not order.coupon_code or order.discount_amount <= 0:
            return
        coupon = self.coupons.get_by_code(order.coupon_code)
        if not coupon:
            logger.warning(
                "order %s snapshotted coupon %s no longer exists; skipping usage log",
                order.id,
                order.coupon_code,
            )
            return
        CouponService(self.db).record_usage(
            coupon, order.user_id, order.id, Decimal(order.discount_amount)
        )

    def _clear_cart(self, user_id: int) -> None:
        # The previous create-order flow left the cart populated. After a
        # successful payment we always clear it — that's the user's mental
        # model when checkout succeeds.
        try:
            self.cart.clear(user_id)
        except Exception as exc:  # cart wipe must not roll back the payment
            logger.warning("post-payment cart clear failed for user=%s: %s", user_id, exc)

    def _restore_stock(self, order: Order) -> None:
        # We decremented stock at checkout to *reserve* it. On failure, give
        # it back so the next shopper can buy the unit.
        for item in order.items:
            product = self.products.get(item.product_id)
            if product:
                product.stock += item.quantity
