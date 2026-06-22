from sqlalchemy import desc, func, select
from sqlalchemy.orm import joinedload

from app.models.referral import Referral, ReferralStatus
from app.repositories.base import BaseRepository


class ReferralRepository(BaseRepository[Referral]):
    model = Referral

    def find_by_referred(self, referred_user_id: int) -> Referral | None:
        stmt = select(Referral).where(Referral.referred_user_id == referred_user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_referrer(
        self, referrer_id: int, *, offset: int = 0, limit: int = 50
    ) -> tuple[list[Referral], int]:
        base = select(Referral).where(Referral.referrer_user_id == referrer_id)
        total = self.db.execute(
            select(func.count()).select_from(Referral).where(
                Referral.referrer_user_id == referrer_id
            )
        ).scalar_one()
        items = list(
            self.db.execute(
                base.options(joinedload(Referral.referred))
                .order_by(desc(Referral.created_at), desc(Referral.id))
                .offset(offset)
                .limit(limit)
            )
            .unique()
            .scalars()
            .all()
        )
        return items, total

    def count_for_referrer(self, referrer_id: int) -> tuple[int, int]:
        """Returns (total, completed)."""
        total = self.db.execute(
            select(func.count()).select_from(Referral).where(
                Referral.referrer_user_id == referrer_id
            )
        ).scalar_one()
        completed = self.db.execute(
            select(func.count())
            .select_from(Referral)
            .where(
                Referral.referrer_user_id == referrer_id,
                Referral.status == ReferralStatus.COMPLETED,
            )
        ).scalar_one()
        return int(total), int(completed)

    def list_admin(
        self,
        *,
        status: ReferralStatus | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Referral], int]:
        stmt = select(Referral).options(
            joinedload(Referral.referrer), joinedload(Referral.referred)
        )
        count_stmt = select(func.count()).select_from(Referral)
        if status is not None:
            stmt = stmt.where(Referral.status == status)
            count_stmt = count_stmt.where(Referral.status == status)
        total = self.db.execute(count_stmt).scalar_one()
        items = list(
            self.db.execute(
                stmt.order_by(desc(Referral.created_at), desc(Referral.id))
                .offset(offset)
                .limit(limit)
            )
            .unique()
            .scalars()
            .all()
        )
        return items, total
