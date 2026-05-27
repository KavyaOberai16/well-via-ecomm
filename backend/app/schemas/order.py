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


# ---- Admin schemas ----


class AdminCustomerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None


class AdminOrderRow(BaseModel):
    """Slim list-row payload — what AdminOrdersPage renders per row."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: OrderStatus
    total_amount: Decimal
    currency: str
    customer_email: str
    item_count: int
    created_at: datetime


class AdminOrderListPage(BaseModel):
    items: list[AdminOrderRow]
    total: int
    page: int
    page_size: int
    counts_by_status: dict[str, int]


class AdminOrderRead(BaseModel):
    """Full order payload for the detail view. Carries fulfillment metadata
    and admin-only notes that we don't surface to the customer."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: OrderStatus
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    coupon_code: str | None
    currency: str
    shipping_address: str | None
    payment_intent_id: str | None
    items: list[OrderItemRead]
    customer: AdminCustomerBrief
    tracking_number: str | None
    carrier: str | None
    paid_at: datetime | None
    shipped_at: datetime | None
    delivered_at: datetime | None
    cancelled_at: datetime | None
    refunded_at: datetime | None
    refund_reason: str | None
    internal_notes: str | None
    created_at: datetime
    updated_at: datetime


class ShipRequest(BaseModel):
    tracking_number: str | None = Field(default=None, max_length=120)
    carrier: str | None = Field(default=None, max_length=60)


class RefundOrCancelRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=255)


class NotesRequest(BaseModel):
    internal_notes: str | None = Field(default=None, max_length=4000)
