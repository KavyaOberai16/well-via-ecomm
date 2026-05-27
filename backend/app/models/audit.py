"""Immutable audit log.

Every sensitive admin action — role assignments, coupon edits, loyalty
adjustments, force-logouts, review moderation — writes one row here. The
table is append-only: there is no UPDATE or DELETE codepath, and the only
read is a filtered list.

Schema choices:
  - `actor_email` is denormalized so the audit row survives if the admin
    account is later deleted.
  - `target_type` + `target_id` are loose strings, not FKs — auditing a
    coupon that was later removed shouldn't break the audit log.
  - `metadata` is JSON for before/after state. Keep it small and human-
    readable; this is for incident response, not analytics.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class AuditEvent(Base, IDMixin, TimestampMixin):
    __tablename__ = "audit_events"

    # Nullable on purpose — survives user deletion. actor_email keeps the
    # human-readable label even when the actor row is gone.
    actor_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    actor_email: Mapped[str | None] = mapped_column(String(255), index=True)
    # IP we observed at the time of action. May be "unknown" if no peer info.
    actor_ip: Mapped[str | None] = mapped_column(String(64))

    # Dotted action name: "role.assign", "coupon.delete", "loyalty.adjust".
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # The thing acted upon. Both nullable so events with no clear target
    # (e.g. "session.revoke_all" without a specific session) still write.
    target_type: Mapped[str | None] = mapped_column(String(32), index=True)
    target_id: Mapped[int | None] = mapped_column(Integer, index=True)
    # Display label — denormalized so the UI can show "deleted coupon SUMMER20"
    # even after the coupon row has been hard-deleted.
    target_label: Mapped[str | None] = mapped_column(String(255))

    # One-line human summary. The UI's primary column.
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    # Free-form structured detail — before/after, ids of related rows, etc.
    # Kept small (a few KB max) since this table grows linearly.
    extra: Mapped[dict | None] = mapped_column(JSON)

    actor: Mapped["User | None"] = relationship(lazy="joined")
