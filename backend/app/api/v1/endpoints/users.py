"""Admin user-management endpoints.

Self-service operations (login, register, me) live in `auth`. This module
is staff-facing: list / search users and inspect role assignment.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.core.exceptions import NotFoundError
from app.repositories.user_repository import UserRepository
from app.schemas.common import Page
from app.schemas.user import UserRead

router = APIRouter()


@router.get(
    "",
    response_model=Page[UserRead],
    dependencies=[Depends(require_permission("users.view"))],
)
def list_users(
    q: str | None = Query(default=None, description="Match against email or full name"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    items, total = UserRepository(db).search(q=q, offset=offset, limit=page_size)
    return Page[UserRead](items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_permission("users.view"))],
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = UserRepository(db).get(user_id)
    if not user:
        raise NotFoundError("User not found")
    return user
