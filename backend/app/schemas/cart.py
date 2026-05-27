from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CartItemRead(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: Decimal
    line_subtotal: Decimal
    line_tax: Decimal
    line_total: Decimal


class CartRead(BaseModel):
    items: list[CartItemRead]
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total: Decimal
    coupon_code: str | None = None
    currency: str = "USD"


class CouponApplyRequest(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def _upper(cls, v: str) -> str:
        return v.strip().upper()
