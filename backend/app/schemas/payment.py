from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus
from app.schemas.order import OrderItemCreate


class CheckoutRequest(BaseModel):
    """Cart -> order + payment in one call. Same shape as OrderCreate plus a
    `currency` override (kept for symmetry; defaults to INR for PhonePe)."""

    items: list[OrderItemCreate] = Field(min_length=1)
    shipping_address: str = Field(min_length=3, max_length=512)
    currency: str | None = Field(default=None, max_length=3)
    # Optional coupon. Validated server-side against the subtotal at order build
    # time; an invalid code raises before stock is reserved.
    coupon_code: str | None = Field(default=None, max_length=64)


class CheckoutResponse(BaseModel):
    order_id: int
    merchant_transaction_id: str
    redirect_url: str
    provider: str
    amount_minor: int
    currency: str


class PaymentStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: int
    merchant_transaction_id: str
    order_status: OrderStatus
    total_amount: Decimal
    currency: str
    updated_at: datetime


class MockWebhookRequest(BaseModel):
    """Body for the mock simulator's "Approve" / "Decline" buttons."""

    merchant_transaction_id: str
    action: str = Field(pattern="^(approve|decline)$")
