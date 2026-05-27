from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.repositories.permission_repository import PermissionRepository
from app.schemas.rbac import (
    PermissionRead,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    UserRolesUpdate,
)
from app.schemas.user import UserRead
from app.services.role_service import RoleService

router = APIRouter()


@router.get(
    "/permissions",
    response_model=list[PermissionRead],
    dependencies=[Depends(require_permission("roles.view"))],
)
def list_permissions(db: Session = Depends(get_db)):
    return PermissionRepository(db).list_all()


@router.get(
    "",
    response_model=list[RoleRead],
    dependencies=[Depends(require_permission("roles.view"))],
)
def list_roles(db: Session = Depends(get_db)):
    return RoleService(db).list_all()


@router.post(
    "",
    response_model=RoleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("roles.create"))],
)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return RoleService(db).create(payload)


@router.get(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permission("roles.view"))],
)
def get_role(role_id: int, db: Session = Depends(get_db)):
    return RoleService(db).get(role_id)


@router.patch(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permission("roles.update"))],
)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db)):
    return RoleService(db).update(role_id, payload)


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("roles.delete"))],
)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    RoleService(db).delete(role_id)


@router.put(
    "/users/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_permission("users.assign_role"))],
)
def assign_roles_to_user(
    user_id: int, payload: UserRolesUpdate, db: Session = Depends(get_db)
):
    return RoleService(db).assign_to_user(user_id, payload.role_ids)
