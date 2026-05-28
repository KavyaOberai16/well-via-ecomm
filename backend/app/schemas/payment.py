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
    # Destination pin. Optional so legacy callers (or stores running
    # shipping.provider=none) still work. When present + provider is
    # configured, the order persists a real shipping_amount.
    shipping_pincode: str | None = Field(default=None, min_length=3, max_length=10)
    currency: str | None = Field(default=None, max_length=3)
    # Optional coupon. Validated server-side against the subtotal at order build
    # time; an invalid code raises before stock is reserved.
    coupon_code: str | None = Field(default=None, max_length=64)
    # Payment method picker. Defaults to 'prepaid' (gateway flow). 'cod'
    # bypasses the gateway and treats the order as paid on placement; the
    # carrier collects on delivery. 'split_cod' charges a slice via the
    # gateway and the carrier collects the rest.
    payment_method: str = Field(default="prepaid", pattern="^(prepaid|cod|split_cod)$")
    # For gateway-routed methods (prepaid + split_cod), the specific
    # instrument the customer picked. Drives the per-instrument discount
    # and gives the gateway a hint about which page to land on. Ignored
    # for full COD (where no instrument applies).
    payment_instrument: str | None = Field(
        default=None, pattern="^(upi|netbanking|card|wallet)$"
    )
    # Customer's contact phone for this order. Used for tracking SMS and,
    # for COD orders, for the OTP gate (must be the same phone the OTP
    # was sent to). Optional for prepaid; required for COD when the
    # `cod.require_otp` setting is on.
    customer_phone: str | None = Field(default=None, min_length=8, max_length=20)


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
