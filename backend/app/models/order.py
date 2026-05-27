import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Order(Base, IDMixin, TimestampMixin):
    __tablename__ = "orders"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True
    )
    # subtotal = sum(unit_price * qty) before tax/discount
    # tax_amount = sum of taxes applied at order time (snapshotted from product.taxes)
    # discount_amount = coupon-derived discount (snapshotted)
    # total_amount = grand total = subtotal + tax_amount - discount_amount
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    coupon_code: Mapped[str | None] = mapped_column(String(64))
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    shipping_address: Mapped[str | None] = mapped_column(String(512))
    payment_intent_id: Mapped[str | None] = mapped_column(String(255), unique=True)

    # Fulfillment metadata. Admin writes these when transitioning the status.
    # `tracking_number` + `carrier` are presentational — the storefront can
    # show "Shipped via UPS, tracking 1Z..." on the order page.
    tracking_number: Mapped[str | None] = mapped_column(String(120))
    carrier: Mapped[str | None] = mapped_column(String(60))

    # Status timestamps. The current `status` is the latest hop; these record
    # *when* each hop happened. Useful for an audit trail and reporting.
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Admin-only annotations. `refund_reason` is a one-liner explaining the
    # last cancel/refund. `internal_notes` is free-form scratchpad — never
    # shown to the customer.
    refund_reason: Mapped[str | None] = mapped_column(String(255))
    internal_notes: Mapped[str | None] = mapped_column(Text)

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    user: Mapped["User"] = relationship(lazy="joined")  # noqa: F821


class OrderItem(Base, IDMixin, TimestampMixin):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"))
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")
