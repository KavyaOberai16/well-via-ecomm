from sqlalchemy import func, select

from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    model = Product

    def get_by_sku(self, sku: str) -> Product | None:
        return self.db.execute(select(Product).where(Product.sku == sku)).scalar_one_or_none()

    def search(
        self,
        *,
        q: str | None = None,
        category_id: int | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Product], int]:
        stmt = select(Product)
        count_stmt = select(func.count()).select_from(Product)

        if q:
            like = f"%{q}%"
            stmt = stmt.where(Product.name.ilike(like))
            count_stmt = count_stmt.where(Product.name.ilike(like))
        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)
            count_stmt = count_stmt.where(Product.category_id == category_id)

        total = self.db.execute(count_stmt).scalar_one()
        items = list(
            self.db.execute(stmt.offset(offset).limit(limit).order_by(Product.id.desc()))
            .scalars()
            .all()
        )
        return items, total

    def decrement_stock(self, product: Product, qty: int) -> None:
        product.stock = product.stock - qty
        self.db.flush()
