from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.wishlist import Wishlist
from app.repositories.product_repository import ProductRepository
from app.repositories.wishlist_repository import WishlistRepository
from app.schemas.wishlist import WishlistItemRead


class WishlistService:
    def __init__(self, db: Session):
        self.db = db
        self.wishlists = WishlistRepository(db)
        self.products = ProductRepository(db)

    def list_for_user(self, user_id: int) -> list[WishlistItemRead]:
        items: list[WishlistItemRead] = []
        for entry in self.wishlists.list_for_user(user_id):
            product = self.products.get(entry.product_id)
            if not product:
                continue
            items.append(
                WishlistItemRead(
                    id=entry.id,
                    product_id=product.id,
                    name=product.name,
                    price=product.price,
                    image_url=product.image_url,
                    created_at=entry.created_at,
                )
            )
        return items

    def add(self, user_id: int, product_id: int) -> Wishlist:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        existing = self.wishlists.find(user_id, product_id)
        if existing:
            raise ConflictError("Product already in wishlist")
        entry = Wishlist(user_id=user_id, product_id=product_id)
        self.wishlists.add(entry)
        self.db.commit()
        return entry

    def remove(self, user_id: int, product_id: int) -> None:
        entry = self.wishlists.find(user_id, product_id)
        if not entry:
            raise NotFoundError("Wishlist item not found")
        self.wishlists.delete(entry)
        self.db.commit()
