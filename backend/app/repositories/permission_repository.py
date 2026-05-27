from sqlalchemy import select

from app.models.rbac import Permission
from app.repositories.base import BaseRepository


class PermissionRepository(BaseRepository[Permission]):
    model = Permission

    def get_by_name(self, name: str) -> Permission | None:
        return self.db.execute(
            select(Permission).where(Permission.name == name)
        ).scalar_one_or_none()

    def get_many_by_names(self, names: list[str]) -> list[Permission]:
        if not names:
            return []
        stmt = select(Permission).where(Permission.name.in_(names))
        return list(self.db.execute(stmt).scalars().all())

    def list_all(self) -> list[Permission]:
        stmt = select(Permission).order_by(Permission.group_name, Permission.name)
        return list(self.db.execute(stmt).scalars().all())
