"""Loyalty ledger + redemption tiers.

The PointsTransaction table is append-only — every earn, redeem, refund-reversal,
expiry, or admin adjustment is one row. Balance is `SUM(delta)` for a user; we
also cache it on `users.points_balance` for cheap reads.

Idempotency: events that come from a domain object (orders, reviews, signups,
redemptions) carry `(ref_type, ref_id)`. The service layer enforces uniqueness
on `(reason, ref_type, ref_id)` so retried webhooks can't double-award. Admin
adjustments deliberately leave both null because multiple adjustments per user
are legitimate.
"""
from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class PointsReason(str, enum.Enum):
    SIGNUP_BONUS = "signup_bonus"
    PLACE_ORDER = "place_order"
    WRITE_REVIEW = "write_review"
    REDEEM = "redeem"
    REFUND_REVERSAL = "refund_reversal"
    EXPIRY = "expiry"
    ADMIN_ADJUST = "admin_adjust"


class PointsTransaction(Base, IDMixin, TimestampMixin):
    __tablename__ = "points_transactions"
    __table_args__ = (
        # The idempotency index. NULL ref_ids do NOT collide in MySQL, which is
        # exactly what we want — admin adjustments leave ref null so multiple
        # rows per user are allowed.
        Index(
            "ux_points_tx_idempotency",
            "reason",
            "ref_type",
            "ref_id",
            unique=True,
            mysql_length={"ref_type": 32},
        ),
        Index("ix_points_tx_user_created", "user_id", "created_at"),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Positive = earned, negative = spent / reversed / expired.
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[PointsReason] = mapped_column(
        Enum(PointsReason), nullable=False, index=True
    )
    # Generic foreign-object reference, kept loose so we don't hard-FK to every
    # source table. Pair `ref_type` (e.g. "order", "review", "coupon", "user")
    # with `ref_id`. Both null for admin adjustments.
    ref_type: Mapped[str | None] = mapped_column(String(32))
    ref_id: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(String(255))

    user: Mapped["User"] = relationship(back_populates="points_transactions")


class RedemptionTier(Base, IDMixin, TimestampMixin):
    """Configurable points-to-coupon trade. Customers see active tiers on the
    /rewards page and pick one. Redemption mints a one-time coupon for them."""

    __tablename__ = "redemption_tiers"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    cost_points: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    # We reuse the coupon discount semantics so checkout doesn't need a second
    # codepath: when redeemed, we mint a Coupon with this discount_type/value.
    discount_type: Mapped[str] = mapped_column(String(16), nullable=False)  # "percent" | "fixed"
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Optional cap for percent tiers, mirrors Coupon.max_discount.
    max_discount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    # The issued coupon expires N days after the user redeems.
    expires_after_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
