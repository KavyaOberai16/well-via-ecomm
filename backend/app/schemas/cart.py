from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CartItemRead(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CartRead(BaseModel):
    items: list[CartItemRead]
    subtotal: Decimal
    currency: str = "USD"
