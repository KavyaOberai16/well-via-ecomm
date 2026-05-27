from sqlalchemy import func, select

from app.models.hero_slide import HeroSlide
from app.repositories.base import BaseRepository


class HeroSlideRepository(BaseRepository[HeroSlide]):
    model = HeroSlide

    def list_active(self) -> list[HeroSlide]:
        stmt = (
            select(HeroSlide)
            .where(HeroSlide.is_active == True)  # noqa: E712
            .order_by(HeroSlide.sort_order.asc(), HeroSlide.id.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def list_all(self) -> list[HeroSlide]:
        stmt = select(HeroSlide).order_by(HeroSlide.sort_order.asc(), HeroSlide.id.asc())
        return list(self.db.execute(stmt).scalars().all())

    def max_sort_order(self) -> int:
        result = self.db.execute(select(func.max(HeroSlide.sort_order))).scalar_one_or_none()
        return result if result is not None else -1

    def get_many(self, ids: list[int]) -> list[HeroSlide]:
        stmt = select(HeroSlide).where(HeroSlide.id.in_(ids))
        return list(self.db.execute(stmt).scalars().all())
