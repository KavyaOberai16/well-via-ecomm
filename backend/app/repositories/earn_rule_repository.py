from sqlalchemy import select

from app.models.loyalty import EarnRule
from app.repositories.base import BaseRepository


class EarnRuleRepository(BaseRepository[EarnRule]):
    model = EarnRule

    def get_by_key(self, key: str) -> EarnRule | None:
        return self.db.execute(
            select(EarnRule).where(EarnRule.key == key)
        ).scalar_one_or_none()

    def list_all(self) -> list[EarnRule]:
        return list(
            self.db.execute(select(EarnRule).order_by(EarnRule.id.asc()))
            .scalars()
            .all()
        )
