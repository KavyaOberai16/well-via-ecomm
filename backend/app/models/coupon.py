from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin


class DiscountType(str, enum.Enum):
    FIXED = "fixed"
    PERCENT = "percent"


class Coupon(Base, IDMixin, TimestampMixin):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    discount_type: Mapped[DiscountType] = mapped_column(
        Enum(DiscountType), nullable=False
    )
    # For PERCENT, value is a percentage (e.g. 10.00 == 10%). For FIXED, currency units.
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    min_order_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    # Caps a percent discount so a 50% coupon on a $1000 cart can't take more than $X.
    max_discount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    usage_limit: Mapped[int | None] = mapped_column(Integer)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    per_user_limit: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    # True when the coupon was minted by the loyalty engine (a customer redeemed
    # points). Lets the admin coupons list filter these out — they're not
    # promotional codes the admin manages.
    is_loyalty_reward: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )

    usages: Mapped[list["CouponUsage"]] = relationship(
        back_populates="coupon", cascade="all, delete-orphan"
    )


class CouponUsage(Base, IDMixin, TimestampMixin):
    __tablename__ = "coupon_usages"

    coupon_id: Mapped[int] = mapped_column(
        ForeignKey("coupons.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Nullable because we record the redemption at checkout *before* the order
    # is finalized — but populate it on PAID so refunds can back out the count.
    order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), index=True
    )
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    coupon: Mapped[Coupon] = relationship(back_populates="usages")
