from sqlalchemy import select

from app.models.wishlist import Wishlist
from app.repositories.base import BaseRepository


class WishlistRepository(BaseRepository[Wishlist]):
    model = Wishlist

    def list_for_user(self, user_id: int) -> list[Wishlist]:
        stmt = (
            select(Wishlist)
            .where(Wishlist.user_id == user_id)
            .order_by(Wishlist.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def find(self, user_id: int, product_id: int) -> Wishlist | None:
        stmt = select(Wishlist).where(
            Wishlist.user_id == user_id, Wishlist.product_id == product_id
        )
        return self.db.execute(stmt).scalar_one_or_none()
