from __future__ import annotations

from typing import TYPE_CHECKING

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.loyalty import PointsTransaction, VipTier
    from app.models.rbac import Role
    from app.models.referral import Referral


class User(Base, IDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    # E.164-ish; we don't enforce the exact pattern. Optional — when present
    # the notification service will send SMS for shippable order events.
    phone: Mapped[str | None] = mapped_column(String(32))
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Legacy shortcut. True == bypass all permission checks. Kept so existing
    # code paths still work; new code should use require_permission().
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Denormalized loyalty totals. `points_balance` = SUM(delta), can go
    # negative on refund reversals. `lifetime_points` only grows from positive
    # deltas — used by future VIP tier logic.
    points_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lifetime_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Per-user shareable referral code (e.g. "REF-VINAY42"). Lazily assigned
    # on first /loyalty/me/referral fetch so accounts created before referrals
    # shipped still work.
    referral_code: Mapped[str | None] = mapped_column(
        String(32), unique=True, index=True
    )
    # Cached VIP tier. Recomputed in LoyaltyService after every positive earn
    # row lands, so we never have to compute it on the read path.
    vip_tier_id: Mapped[int | None] = mapped_column(
        ForeignKey("vip_tiers.id", ondelete="SET NULL"), index=True
    )

    # TOTP / 2FA. `totp_secret` holds the encrypted base32 secret (encrypted
    # via Fernet keyed off SECRET_KEY). `totp_enabled` only flips True after
    # the user confirms a code — until then enrollment is "pending" with the
    # secret present but unconfirmed. `backup_codes` stores 10 single-use
    # codes, each as a salted hash; the cleartext is shown ONCE at enrollment.
    totp_secret: Mapped[str | None] = mapped_column(String(255))
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    totp_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    backup_codes: Mapped[list[str] | None] = mapped_column(JSON)

    roles: Mapped[list["Role"]] = relationship(
        secondary="user_roles", back_populates="users", lazy="selectin"
    )

    points_transactions: Mapped[list["PointsTransaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # Referrals this user *made* (people they brought in).
    referrals_made: Mapped[list["Referral"]] = relationship(
        foreign_keys="Referral.referrer_user_id",
        back_populates="referrer",
        cascade="all, delete-orphan",
    )
    # The single referral row where this user is the *referred* side (or empty
    # list when self-signup). Modeled as a list for SA convenience; the unique
    # constraint on referred_user_id enforces at most one.
    referred_by: Mapped[list["Referral"]] = relationship(
        foreign_keys="Referral.referred_user_id",
        back_populates="referred",
        cascade="all, delete-orphan",
    )

    vip_tier: Mapped["VipTier | None"] = relationship(lazy="selectin")

    def has_permission(self, permission_name: str) -> bool:
        if self.is_admin:
            return True
        for role in self.roles:
            for perm in role.permissions:
                if perm.name == permission_name:
                    return True
        return False

    @property
    def permissions(self) -> list[str]:
        """Flat sorted list of permission names this user holds.

        Picked up by UserRead via from_attributes so the frontend can mirror
        server-side checks. Admins get the full registry expanded so
        `permissions.includes(x)` on the client matches `has_permission(x)`.
        """
        if self.is_admin:
            # Import lazily — avoid model→service import cycle at module load.
            from app.services.permissions_registry import all_permission_names

            return all_permission_names()
        names: set[str] = set()
        for role in self.roles:
            for perm in role.permissions:
                names.add(perm.name)
        return sorted(names)
