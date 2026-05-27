from sqlalchemy import func, select

from app.models.coupon import Coupon, CouponUsage
from app.repositories.base import BaseRepository


class CouponRepository(BaseRepository[Coupon]):
    model = Coupon

    def get_by_code(self, code: str) -> Coupon | None:
        return self.db.execute(
            select(Coupon).where(Coupon.code == code)
        ).scalar_one_or_none()

    def list_all(self) -> list[Coupon]:
        return list(
            self.db.execute(select(Coupon).order_by(Coupon.id.desc())).scalars().all()
        )

    def list_active(self) -> list[Coupon]:
        stmt = select(Coupon).where(Coupon.is_active == True).order_by(Coupon.id.desc())  # noqa: E712
        return list(self.db.execute(stmt).scalars().all())


class CouponUsageRepository(BaseRepository[CouponUsage]):
    model = CouponUsage

    def count_for_user(self, coupon_id: int, user_id: int) -> int:
        stmt = (
            select(func.count())
            .select_from(CouponUsage)
            .where(CouponUsage.coupon_id == coupon_id, CouponUsage.user_id == user_id)
        )
        return self.db.execute(stmt).scalar_one()

    def find_for_order(self, order_id: int) -> CouponUsage | None:
        stmt = select(CouponUsage).where(CouponUsage.order_id == order_id)
        return self.db.execute(stmt).scalar_one_or_none()
