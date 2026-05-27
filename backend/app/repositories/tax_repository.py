from sqlalchemy import select

from app.models.tax import Tax
from app.repositories.base import BaseRepository


class TaxRepository(BaseRepository[Tax]):
    model = Tax

    def list_active(self) -> list[Tax]:
        stmt = select(Tax).where(Tax.is_active == True).order_by(Tax.name)  # noqa: E712
        return list(self.db.execute(stmt).scalars().all())

    def list_all(self) -> list[Tax]:
        return list(self.db.execute(select(Tax).order_by(Tax.name)).scalars().all())

    def get_many(self, ids: list[int]) -> list[Tax]:
        if not ids:
            return []
        return list(self.db.execute(select(Tax).where(Tax.id.in_(ids))).scalars().all())
