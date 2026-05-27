"""Audit logger.

Single public entry point: `AuditService(db).record(actor, ip, action, ...)`.
Every audited service grabs an instance and calls .record() inside the same
transaction as the change — so an audit row exists iff the change committed.

Failures here are LOGGED, not raised. Losing an audit row is bad, but losing
the user-facing action because the audit write failed is worse.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit import AuditEvent
from app.models.user import User
from app.repositories.audit_repository import AuditEventRepository

logger = logging.getLogger(__name__)


class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditEventRepository(db)

    def record(
        self,
        *,
        actor: User | None,
        actor_ip: str | None,
        action: str,
        target_type: str | None = None,
        target_id: int | None = None,
        target_label: str | None = None,
        summary: str,
        extra: dict[str, Any] | None = None,
    ) -> AuditEvent | None:
        """Insert one audit row. Flushes (so the row exists at commit time)
        but does NOT commit — the caller's transaction owns the commit so the
        audit row and the change land atomically.

        Returns None when the write itself fails — the caller's flow continues
        regardless. Audit must never block business logic.
        """
        try:
            row = AuditEvent(
                actor_user_id=actor.id if actor else None,
                actor_email=actor.email if actor else None,
                actor_ip=(actor_ip or "")[:64] or None,
                action=action,
                target_type=target_type,
                target_id=target_id,
                target_label=(target_label or "")[:255] or None,
                summary=summary[:500],
                extra=extra,
            )
            self.repo.add(row)
            return row
        except Exception as exc:  # noqa: BLE001
            logger.warning("audit.record failed (%s): %s", action, exc)
            return None

    def list_admin(
        self,
        *,
        action: str | None = None,
        actor_user_id: int | None = None,
        target_type: str | None = None,
        target_id: int | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[AuditEvent], int]:
        return self.repo.list_admin(
            action=action,
            actor_user_id=actor_user_id,
            target_type=target_type,
            target_id=target_id,
            offset=offset,
            limit=limit,
        )

    def distinct_actions(self) -> list[str]:
        return self.repo.distinct_actions()
