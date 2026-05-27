from datetime import datetime
from typing import Any

from pydantic import BaseModel


class MetricDelta(BaseModel):
    """Single KPI card: current period value, previous period value, % change.

    `delta_pct` is None when previous was 0 — the UI shows "—" instead of
    infinity. Lets the same response shape serve every card.
    """

    current: float
    previous: float
    delta_pct: float | None


class IntMetricDelta(BaseModel):
    current: int
    previous: int
    delta_pct: float | None


class SummaryBlock(BaseModel):
    revenue: MetricDelta
    orders: IntMetricDelta
    new_customers: IntMetricDelta
    aov: MetricDelta


class RevenuePoint(BaseModel):
    date: str
    revenue: float
    orders: int


class TopProduct(BaseModel):
    product_id: int
    name: str
    sku: str
    units: int
    revenue: float


class RecentOrder(BaseModel):
    id: int
    status: str
    total_amount: float
    currency: str
    created_at: datetime | None
    customer_email: str


class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    stock: int
    price: float


class DashboardOverview(BaseModel):
    period: str
    period_start: datetime
    period_end: datetime
    summary: SummaryBlock
    revenue_series: list[RevenuePoint]
    orders_by_status: dict[str, int]
    top_products: list[TopProduct]
    recent_orders: list[RecentOrder]
    low_stock: list[LowStockProduct]
