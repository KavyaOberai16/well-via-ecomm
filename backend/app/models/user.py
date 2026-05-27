from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.loyalty import PointsTransaction
    from app.models.rbac import Role


class User(Base, IDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
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

    roles: Mapped[list["Role"]] = relationship(
        secondary="user_roles", back_populates="users", lazy="selectin"
    )

    points_transactions: Mapped[list["PointsTransaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

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
