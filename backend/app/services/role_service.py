from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.rbac import Role
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.rbac import RoleCreate, RoleUpdate


class RoleService:
    def __init__(self, db: Session):
        self.db = db
        self.roles = RoleRepository(db)
        self.permissions = PermissionRepository(db)
        self.users = UserRepository(db)

    def list_all(self) -> list[Role]:
        return self.roles.list_all()

    def get(self, role_id: int) -> Role:
        role = self.roles.get_with_permissions(role_id)
        if not role:
            raise NotFoundError("Role not found")
        return role

    def create(self, data: RoleCreate) -> Role:
        if self.roles.get_by_name(data.name):
            raise ConflictError(f"Role '{data.name}' already exists")
        role = Role(name=data.name, description=data.description, is_system=False)
        if data.permission_ids:
            role.permissions = [
                p
                for p in (self.permissions.get(pid) for pid in data.permission_ids)
                if p is not None
            ]
        self.roles.add(role)
        self.db.commit()
        return self.get(role.id)

    def update(self, role_id: int, data: RoleUpdate) -> Role:
        role = self.get(role_id)
        if data.name is not None and data.name != role.name:
            if role.is_system:
                raise ForbiddenError("System roles cannot be renamed")
            if self.roles.get_by_name(data.name):
                raise ConflictError(f"Role '{data.name}' already exists")
            role.name = data.name
        if data.description is not None:
            role.description = data.description
        if data.permission_ids is not None:
            role.permissions = [
                p
                for p in (self.permissions.get(pid) for pid in data.permission_ids)
                if p is not None
            ]
        self.db.commit()
        return self.get(role_id)

    def delete(self, role_id: int) -> None:
        role = self.get(role_id)
        if role.is_system:
            raise ForbiddenError("System roles cannot be deleted")
        self.roles.delete(role)
        self.db.commit()

    def assign_to_user(self, user_id: int, role_ids: list[int]) -> User:
        user = self.users.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        user.roles = [r for r in (self.roles.get(rid) for rid in role_ids) if r is not None]
        self.db.commit()
        self.db.refresh(user)
        return user
