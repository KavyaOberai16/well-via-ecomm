"""One-shot RBAC bootstrap. Idempotent — safe to run on every app start.

- Upserts the canonical permission list (PERMISSIONS in permissions_registry).
- Ensures the `admin` (all perms) and `customer` (empty) system roles exist.
- Backfills the admin role onto every `is_admin=True` user that doesn't already
  have it, so the legacy flag and the new RBAC model stay in sync.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.rbac import Permission, Role
from app.models.user import User
from app.services.permissions_registry import PERMISSIONS

logger = logging.getLogger(__name__)


def seed_rbac(db: Session) -> None:
    _upsert_permissions(db)
    _ensure_system_roles(db)
    _backfill_admin_role(db)
    db.commit()


def _upsert_permissions(db: Session) -> None:
    existing_by_name = {
        p.name: p for p in db.execute(select(Permission)).scalars().all()
    }
    for spec in PERMISSIONS:
        perm = existing_by_name.get(spec.name)
        if perm is None:
            db.add(
                Permission(
                    name=spec.name,
                    description=spec.description,
                    group_name=spec.group,
                )
            )
        else:
            # Keep the description / group fresh; admins should never need to
            # hand-edit these.
            perm.description = spec.description
            perm.group_name = spec.group
    db.flush()


def _ensure_system_roles(db: Session) -> None:
    all_perms = list(db.execute(select(Permission)).scalars().all())

    admin = db.execute(select(Role).where(Role.name == "admin")).scalar_one_or_none()
    if admin is None:
        admin = Role(
            name="admin",
            description="Full access to all resources",
            is_system=True,
            permissions=all_perms,
        )
        db.add(admin)
    else:
        # Admin role always tracks the full perm list.
        admin.permissions = all_perms
        admin.is_system = True

    customer = db.execute(select(Role).where(Role.name == "customer")).scalar_one_or_none()
    if customer is None:
        db.add(
            Role(
                name="customer",
                description="Default shopper role — no admin access",
                is_system=True,
                permissions=[],
            )
        )
    else:
        customer.is_system = True

    db.flush()


def _backfill_admin_role(db: Session) -> None:
    admin = db.execute(select(Role).where(Role.name == "admin")).scalar_one_or_none()
    if admin is None:
        return
    admin_users = list(db.execute(select(User).where(User.is_admin == True)).scalars().all())  # noqa: E712
    for user in admin_users:
        if admin not in user.roles:
            user.roles.append(admin)
    if admin_users:
        logger.info("RBAC seed: linked admin role to %d existing admin user(s)", len(admin_users))
