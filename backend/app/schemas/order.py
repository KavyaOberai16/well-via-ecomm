from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)
    shipping_address: str | None = None


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: OrderStatus
    subtotal: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    total_amount: Decimal
    coupon_code: str | None = None
    currency: str
    shipping_address: str | None
    items: list[OrderItemRead]
    created_at: datetime
