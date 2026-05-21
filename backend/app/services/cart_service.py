"""Redis-backed cart. Stateless across web workers.

Cart is stored as a hash: cart:{user_id} -> { product_id: quantity }.
"""
from decimal import Decimal

import redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.repositories.product_repository import ProductRepository
from app.schemas.cart import CartItemIn, CartItemRead, CartRead


def _key(user_id: int) -> str:
    return f"cart:{user_id}"


class CartService:
    def __init__(self, db: Session, redis_client: redis.Redis | None = None):
        self.db = db
        self.products = ProductRepository(db)
        self.redis = redis_client or redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

    def add_item(self, user_id: int, item: CartItemIn) -> None:
        product = self.products.get(item.product_id)
        if not product:
            raise NotFoundError("Product not found")
        self.redis.hincrby(_key(user_id), str(item.product_id), item.quantity)

    def remove_item(self, user_id: int, product_id: int) -> None:
        self.redis.hdel(_key(user_id), str(product_id))

    def clear(self, user_id: int) -> None:
        self.redis.delete(_key(user_id))

    def get(self, user_id: int) -> CartRead:
        raw: dict[str, str] = self.redis.hgetall(_key(user_id))  # type: ignore[assignment]
        items: list[CartItemRead] = []
        subtotal = Decimal("0.00")
        for pid_str, qty_str in raw.items():
            product = self.products.get(int(pid_str))
            if not product:
                continue
            qty = int(qty_str)
            line_total = product.price * qty
            subtotal += line_total
            items.append(
                CartItemRead(
                    product_id=product.id,
                    name=product.name,
                    quantity=qty,
                    unit_price=product.price,
                    line_total=line_total,
                )
            )
        return CartRead(items=items, subtotal=subtotal)
