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
    # Set on positive earn rows; the expiry job will mint negative EXPIRY rows
    # for the unconsumed portion of any earn whose expires_at has passed.
    # Null for spend/reverse/expiry/admin_adjust rows (they don't expire).
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), index=True
    )

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


class EarnRule(Base, IDMixin, TimestampMixin):
    """Admin-editable earn rule. The `key` is the machine identifier read by
    the loyalty engine (e.g. "signup_bonus", "place_order"). v3 ships with a
    fixed set of keys — adding a new earn event still requires code (it has
    to be triggered from somewhere) but the values are tunable from the UI."""

    __tablename__ = "earn_rules"

    # Machine identifier. Used by LoyaltyService to look up the rule from code.
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    # Human-readable label shown in the admin UI.
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    # Meaning depends on the rule:
    #   signup_bonus: flat points on registration
    #   place_order:  points per currency unit on subtotal − discount
    #   write_review: flat points per submitted review
    points_value: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)


class VipTier(Base, IDMixin, TimestampMixin):
    """VIP ladder — a customer's current tier is the highest one whose
    threshold ≤ their lifetime_points. Multiplier is applied to all positive
    earn rows so VIPs accumulate faster."""

    __tablename__ = "vip_tiers"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    # Lifetime points required to enter this tier. Lowest tier should be 0.
    threshold_lifetime_points: Mapped[int] = mapped_column(
        Integer, nullable=False, index=True
    )
    # 1.00 = no boost. 1.50 = 50% extra on every earn.
    earn_multiplier: Mapped[Decimal] = mapped_column(
        Numeric(4, 2), default=Decimal("1.00"), nullable=False
    )
    # Free-text benefits description for the storefront.
    benefits: Mapped[str | None] = mapped_column(String(500))
    # Optional hex color shown on the tier badge (e.g. "#CD7F32" for Bronze).
    color: Mapped[str | None] = mapped_column(String(16))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
