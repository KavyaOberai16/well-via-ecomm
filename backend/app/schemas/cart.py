from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CartItemQuantityUpdate(BaseModel):
    """Body for PUT /cart/items/{product_id}. Quantity of 0 removes the line —
    the endpoint normalizes the call so the customer-side UI doesn't need
    to switch between PUT and DELETE based on the stepper value."""

    quantity: int = Field(ge=0, le=999)


class CartItemRead(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: Decimal
    # MRP shown as a strikethrough when present. Sourced from
    # `products.compare_at_price`; absent when the product has no MRP set.
    compare_at_price: Decimal | None = None
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
