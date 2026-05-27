from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.rbac import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    model = Role

    def get_by_name(self, name: str) -> Role | None:
        stmt = select(Role).options(selectinload(Role.permissions)).where(Role.name == name)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_with_permissions(self, role_id: int) -> Role | None:
        stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_all(self) -> list[Role]:
        stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.id.asc())
        return list(self.db.execute(stmt).scalars().all())
