from sqlalchemy import desc, select

from app.models.loyalty import VipTier
from app.repositories.base import BaseRepository


class VipTierRepository(BaseRepository[VipTier]):
    model = VipTier

    def list_all(self) -> list[VipTier]:
        """Ordered by threshold ascending — lowest tier first. Convenient for
        the storefront ladder display."""
        return list(
            self.db.execute(
                select(VipTier).order_by(VipTier.threshold_lifetime_points.asc())
            )
            .scalars()
            .all()
        )

    def find_for_points(self, lifetime_points: int) -> VipTier | None:
        """Highest tier whose threshold <= lifetime_points."""
        stmt = (
            select(VipTier)
            .where(VipTier.threshold_lifetime_points <= lifetime_points)
            .order_by(desc(VipTier.threshold_lifetime_points))
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def find_next(self, current_threshold: int) -> VipTier | None:
        """The tier just above the current threshold (for `progress to next`)."""
        stmt = (
            select(VipTier)
            .where(VipTier.threshold_lifetime_points > current_threshold)
            .order_by(VipTier.threshold_lifetime_points.asc())
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()
