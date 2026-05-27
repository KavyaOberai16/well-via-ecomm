"""Referral records — one row per (referrer → friend) pairing.

Status moves PENDING → COMPLETED when the referred user lands their first
PAID order. The friend's welcome coupon is minted at signup (so they have
something to use), the referrer reward is minted at order PAID (so we don't
pay out for fake signups).
"""
from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class ReferralStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class Referral(Base, IDMixin, TimestampMixin):
    __tablename__ = "referrals"
    __table_args__ = (
        # A user can be the *referred* side only once. Prevents the same friend
        # from being credited to two different referrers.
        UniqueConstraint("referred_user_id", name="uq_referrals_referred_user"),
    )

    referrer_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    referred_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # The code the friend used at signup (denormalized for audit; the referrer's
    # current code may change later but the historical record is preserved).
    code: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    status: Mapped[ReferralStatus] = mapped_column(
        Enum(ReferralStatus),
        default=ReferralStatus.PENDING,
        nullable=False,
        index=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Tracks which order triggered completion — useful for refunds (future v3:
    # reverse the referrer reward if the order is cancelled).
    completed_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL")
    )

    referrer: Mapped["User"] = relationship(
        foreign_keys=[referrer_user_id], back_populates="referrals_made"
    )
    referred: Mapped["User"] = relationship(
        foreign_keys=[referred_user_id], back_populates="referred_by"
    )
