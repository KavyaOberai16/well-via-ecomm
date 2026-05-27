"""Admin-only audit log reader. The write path is internal — services and
endpoints call AuditService.record(); there is intentionally no public API
to insert or mutate rows."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.schemas.audit import AuditEventListPage, AuditEventRead
from app.services.audit_service import AuditService

router = APIRouter()


@router.get(
    "",
    response_model=AuditEventListPage,
    dependencies=[Depends(require_permission("audit.view"))],
)
def list_audit_events(
    action: str | None = Query(default=None),
    actor_user_id: int | None = Query(default=None, ge=1),
    target_type: str | None = Query(default=None),
    target_id: int | None = Query(default=None, ge=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    svc = AuditService(db)
    offset = (page - 1) * page_size
    items, total = svc.list_admin(
        action=action,
        actor_user_id=actor_user_id,
        target_type=target_type,
        target_id=target_id,
        offset=offset,
        limit=page_size,
    )
    return AuditEventListPage(
        items=[AuditEventRead.model_validate(e) for e in items],
        total=total,
        page=page,
        page_size=page_size,
        available_actions=svc.distinct_actions(),
    )
