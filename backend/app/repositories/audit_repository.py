from sqlalchemy import desc, func, select
from sqlalchemy.orm import joinedload

from app.models.audit import AuditEvent
from app.repositories.base import BaseRepository


class AuditEventRepository(BaseRepository[AuditEvent]):
    model = AuditEvent

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
        stmt = select(AuditEvent).options(joinedload(AuditEvent.actor))
        count_stmt = select(func.count()).select_from(AuditEvent)
        if action:
            stmt = stmt.where(AuditEvent.action == action)
            count_stmt = count_stmt.where(AuditEvent.action == action)
        if actor_user_id is not None:
            stmt = stmt.where(AuditEvent.actor_user_id == actor_user_id)
            count_stmt = count_stmt.where(AuditEvent.actor_user_id == actor_user_id)
        if target_type:
            stmt = stmt.where(AuditEvent.target_type == target_type)
            count_stmt = count_stmt.where(AuditEvent.target_type == target_type)
        if target_id is not None:
            stmt = stmt.where(AuditEvent.target_id == target_id)
            count_stmt = count_stmt.where(AuditEvent.target_id == target_id)

        total = self.db.execute(count_stmt).scalar_one()
        items = list(
            self.db.execute(
                stmt.order_by(desc(AuditEvent.created_at), desc(AuditEvent.id))
                .offset(offset)
                .limit(limit)
            )
            .unique()
            .scalars()
            .all()
        )
        return items, total

    def distinct_actions(self) -> list[str]:
        rows = self.db.execute(
            select(AuditEvent.action).distinct().order_by(AuditEvent.action)
        ).all()
        return [r[0] for r in rows]
