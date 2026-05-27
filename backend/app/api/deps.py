from typing import Generator

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.user_repository import UserRepository


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise UnauthorizedError("Wrong token type")

    user_id = int(payload["sub"])
    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or disabled")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise ForbiddenError("Admin privileges required")
    return user


def require_permission(permission: str):
    """Dependency factory for fine-grained permission checks.

    Usage:  Depends(require_permission("products.create"))

    is_admin users bypass the check (see User.has_permission). This keeps the
    legacy admin flag working while opt-in RBAC layers on for non-admin staff.
    """

    def _checker(user: User = Depends(get_current_user)) -> User:
        if not user.has_permission(permission):
            raise ForbiddenError(f"Missing required permission: {permission}")
        return user

    return _checker
