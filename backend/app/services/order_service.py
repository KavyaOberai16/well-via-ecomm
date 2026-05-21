from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.order import Order, OrderItem, OrderStatus
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.order import OrderCreate


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)
        self.products = ProductRepository(db)

    def create(self, user_id: int, data: OrderCreate) -> Order:
        order = Order(user_id=user_id, shipping_address=data.shipping_address)
        total = Decimal("0.00")

        for line in data.items:
            product = self.products.get(line.product_id)
            if not product:
                raise NotFoundError(f"Product {line.product_id} not found")
            if product.stock < line.quantity:
                raise ConflictError(f"Insufficient stock for {product.sku}")

            self.products.decrement_stock(product, line.quantity)
            item = OrderItem(
                product_id=product.id,
                quantity=line.quantity,
                unit_price=product.price,
            )
            order.items.append(item)
            total += product.price * line.quantity

        order.total_amount = total
        order.status = OrderStatus.PENDING
        self.orders.add(order)
        self.db.commit()
        return self.orders.get_with_items(order.id)  # type: ignore[return-value]

    def get_for_user(self, user_id: int, order_id: int) -> Order:
        order = self.orders.get_with_items(order_id)
        if not order or order.user_id != user_id:
            raise NotFoundError("Order not found")
        return order

    def list_for_user(self, user_id: int, *, offset: int, limit: int) -> list[Order]:
        return self.orders.list_for_user(user_id, offset=offset, limit=limit)
