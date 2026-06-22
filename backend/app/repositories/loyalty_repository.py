from sqlalchemy import desc, func, select

from app.models.loyalty import PointsReason, PointsTransaction, RedemptionTier
from app.repositories.base import BaseRepository


class PointsTransactionRepository(BaseRepository[PointsTransaction]):
    model = PointsTransaction

    def find_by_ref(
        self, reason: PointsReason, ref_type: str | None, ref_id: int | None
    ) -> PointsTransaction | None:
        """Used by the service to short-circuit before attempting an insert
        that would hit the (reason, ref_type, ref_id) unique constraint."""
        stmt = select(PointsTransaction).where(
            PointsTransaction.reason == reason,
            PointsTransaction.ref_type == ref_type,
            PointsTransaction.ref_id == ref_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_for_user(
        self, user_id: int, *, offset: int = 0, limit: int = 50
    ) -> tuple[list[PointsTransaction], int]:
        stmt = (
            select(PointsTransaction)
            .where(PointsTransaction.user_id == user_id)
            .order_by(desc(PointsTransaction.created_at), desc(PointsTransaction.id))
        )
        count_stmt = (
            select(func.count())
            .select_from(PointsTransaction)
            .where(PointsTransaction.user_id == user_id)
        )
        total = self.db.execute(count_stmt).scalar_one()
        items = list(
            self.db.execute(stmt.offset(offset).limit(limit)).scalars().all()
        )
        return items, total

    def sum_for_user(self, user_id: int) -> int:
        stmt = select(func.coalesce(func.sum(PointsTransaction.delta), 0)).where(
            PointsTransaction.user_id == user_id
        )
        return int(self.db.execute(stmt).scalar_one())


class RedemptionTierRepository(BaseRepository[RedemptionTier]):
    model = RedemptionTier

    def list_all(self, *, active_only: bool = False) -> list[RedemptionTier]:
        stmt = select(RedemptionTier).order_by(RedemptionTier.cost_points.asc())
        if active_only:
            stmt = stmt.where(RedemptionTier.is_active == True)  # noqa: E712
        return list(self.db.execute(stmt).scalars().all())
