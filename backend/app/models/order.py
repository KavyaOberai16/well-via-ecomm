import enum
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String
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

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base, IDMixin, TimestampMixin):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"))
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")
