from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "permission_id",
        Integer,
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Permission(Base, IDMixin, TimestampMixin):
    __tablename__ = "permissions"

    # Dotted convention: "<resource>.<action>" e.g. "products.create", "orders.refund".
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    # Grouping label so the admin UI can render permissions in sections.
    group_name: Mapped[str | None] = mapped_column(String(50), index=True)

    roles: Mapped[list["Role"]] = relationship(
        secondary=role_permissions, back_populates="permissions"
    )


class Role(Base, IDMixin, TimestampMixin):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("name", name="uq_roles_name"),)

    name: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    # System roles (e.g. admin, customer) cannot be deleted from the UI —
    # the bootstrap seeder relies on their existence.
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    permissions: Mapped[list[Permission]] = relationship(
        secondary=role_permissions, back_populates="roles", lazy="selectin"
    )
    users: Mapped[list["User"]] = relationship(
        secondary=user_roles, back_populates="roles"
    )
