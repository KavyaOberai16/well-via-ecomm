from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)

    def create(self, data: ProductCreate) -> Product:
        if self.repo.get_by_sku(data.sku):
            raise ConflictError(f"SKU {data.sku} already exists")
        product = Product(**data.model_dump())
        self.repo.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def get(self, product_id: int) -> Product:
        product = self.repo.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    def update(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get(product_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(product, k, v)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product_id: int) -> None:
        product = self.get(product_id)
        self.repo.delete(product)
        self.db.commit()

    def search(
        self, *, q: str | None, category_id: int | None, offset: int, limit: int
    ) -> tuple[list[Product], int]:
        return self.repo.search(q=q, category_id=category_id, offset=offset, limit=limit)
