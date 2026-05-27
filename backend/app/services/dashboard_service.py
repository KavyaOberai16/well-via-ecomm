"""Admin dashboard aggregates.

One service, one read endpoint. The dashboard issues 6 small queries and
shapes them into a single payload — admins are looking at every section at
once, so paying for 6 round-trips instead of one would be silly.

Revenue rule: an order counts toward revenue iff its status is in
PAID / SHIPPED / DELIVERED. Refunded and cancelled are explicitly EXCLUDED
— this matches the loyalty earn rule and means a refund visibly *removes*
the order from headline revenue.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User

# Orders that "earned us money". Pending hasn't paid; cancelled/refunded
# already gave the money back.
_REVENUE_STATUSES = (
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
)


def _period_bounds(period: str, now: datetime) -> tuple[datetime, datetime, datetime]:
    """Return (period_start, prev_start, prev_end) for the requested period.

    `period_start..now` is the current window. `prev_start..prev_end` is the
    immediately preceding window of equal length, used for the % delta cards.
    """
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    period_start = now - timedelta(days=days)
    prev_end = period_start
    prev_start = period_start - timedelta(days=days)
    return period_start, prev_start, prev_end


def _pct_delta(now_val: float, prev_val: float) -> float | None:
    """Percentage change from `prev_val` to `now_val`.

    Returns None when prev_val is 0 — UI shows "—" rather than infinity.
    """
    if prev_val <= 0:
        return None
    return round(((now_val - prev_val) / prev_val) * 100, 1)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def overview(self, *, period: str = "30d") -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        period_start, prev_start, prev_end = _period_bounds(period, now)

        summary_now = self._revenue_summary(period_start, now)
        summary_prev = self._revenue_summary(prev_start, prev_end)
        new_customers_now = self._new_customers(period_start, now)
        new_customers_prev = self._new_customers(prev_start, prev_end)

        return {
            "period": period,
            "period_start": period_start.isoformat(),
            "period_end": now.isoformat(),
            "summary": {
                "revenue": {
                    "current": float(summary_now["revenue"]),
                    "previous": float(summary_prev["revenue"]),
                    "delta_pct": _pct_delta(
                        float(summary_now["revenue"]),
                        float(summary_prev["revenue"]),
                    ),
                },
                "orders": {
                    "current": summary_now["count"],
                    "previous": summary_prev["count"],
                    "delta_pct": _pct_delta(
                        summary_now["count"], summary_prev["count"]
                    ),
                },
                "new_customers": {
                    "current": new_customers_now,
                    "previous": new_customers_prev,
                    "delta_pct": _pct_delta(new_customers_now, new_customers_prev),
                },
                "aov": {
                    "current": float(summary_now["aov"]),
                    "previous": float(summary_prev["aov"]),
                    "delta_pct": _pct_delta(
                        float(summary_now["aov"]), float(summary_prev["aov"])
                    ),
                },
            },
            "revenue_series": self._revenue_series(period_start, now),
            "orders_by_status": self._orders_by_status(),
            "top_products": self._top_products(period_start, now, limit=5),
            "recent_orders": self._recent_orders(limit=10),
            "low_stock": self._low_stock(threshold=5, limit=8),
        }

    # ---- Pieces ----

    def _revenue_summary(self, start: datetime, end: datetime) -> dict[str, Any]:
        row = self.db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0),
                func.count(Order.id),
            ).where(
                Order.status.in_(_REVENUE_STATUSES),
                Order.created_at >= start,
                Order.created_at < end,
            )
        ).one()
        revenue = Decimal(row[0] or 0)
        count = int(row[1] or 0)
        aov = revenue / count if count > 0 else Decimal("0")
        return {"revenue": revenue, "count": count, "aov": aov}

    def _new_customers(self, start: datetime, end: datetime) -> int:
        return int(
            self.db.execute(
                select(func.count(User.id)).where(
                    User.created_at >= start, User.created_at < end
                )
            ).scalar_one()
        )

    def _revenue_series(self, start: datetime, end: datetime) -> list[dict[str, Any]]:
        """Daily revenue + order count between `start` and `end`. Returned
        densely (zero-filled) so the line chart isn't full of gaps for days
        with no orders."""
        # GROUP BY DATE(created_at). Works on MySQL.
        rows = self.db.execute(
            select(
                func.date(Order.created_at).label("day"),
                func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
                func.count(Order.id).label("orders"),
            )
            .where(
                Order.status.in_(_REVENUE_STATUSES),
                Order.created_at >= start,
                Order.created_at < end,
            )
            .group_by("day")
            .order_by("day")
        ).all()
        by_day: dict[str, dict[str, Any]] = {}
        for r in rows:
            day = r[0]
            key = day.isoformat() if hasattr(day, "isoformat") else str(day)
            by_day[key] = {"date": key, "revenue": float(r[1] or 0), "orders": int(r[2] or 0)}

        # Densify: fill every day in the window so charts plot a clean line.
        out: list[dict[str, Any]] = []
        cursor = start.date()
        end_date = end.date()
        while cursor <= end_date:
            key = cursor.isoformat()
            out.append(by_day.get(key, {"date": key, "revenue": 0.0, "orders": 0}))
            cursor = cursor + timedelta(days=1)
        return out

    def _orders_by_status(self) -> dict[str, int]:
        rows = self.db.execute(
            select(Order.status, func.count(Order.id)).group_by(Order.status)
        ).all()
        return {
            (r[0].value if hasattr(r[0], "value") else str(r[0])): int(r[1])
            for r in rows
        }

    def _top_products(
        self, start: datetime, end: datetime, *, limit: int
    ) -> list[dict[str, Any]]:
        rows = self.db.execute(
            select(
                Product.id,
                Product.name,
                Product.sku,
                func.sum(OrderItem.quantity).label("units"),
                func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.status.in_(_REVENUE_STATUSES),
                Order.created_at >= start,
                Order.created_at < end,
            )
            .group_by(Product.id, Product.name, Product.sku)
            .order_by(desc("units"))
            .limit(limit)
        ).all()
        return [
            {
                "product_id": int(r[0]),
                "name": r[1],
                "sku": r[2],
                "units": int(r[3] or 0),
                "revenue": float(r[4] or 0),
            }
            for r in rows
        ]

    def _recent_orders(self, *, limit: int) -> list[dict[str, Any]]:
        rows = self.db.execute(
            select(
                Order.id,
                Order.status,
                Order.total_amount,
                Order.currency,
                Order.created_at,
                User.email,
            )
            .join(User, User.id == Order.user_id)
            .order_by(desc(Order.created_at), desc(Order.id))
            .limit(limit)
        ).all()
        return [
            {
                "id": int(r[0]),
                "status": r[1].value if hasattr(r[1], "value") else str(r[1]),
                "total_amount": float(r[2] or 0),
                "currency": r[3],
                "created_at": r[4].isoformat() if r[4] else None,
                "customer_email": r[5],
            }
            for r in rows
        ]

    def _low_stock(self, *, threshold: int, limit: int) -> list[dict[str, Any]]:
        rows = self.db.execute(
            select(Product.id, Product.name, Product.sku, Product.stock, Product.price)
            .where(Product.stock <= threshold)
            .order_by(Product.stock.asc(), Product.name.asc())
            .limit(limit)
        ).all()
        return [
            {
                "id": int(r[0]),
                "name": r[1],
                "sku": r[2],
                "stock": int(r[3] or 0),
                "price": float(r[4] or 0),
            }
            for r in rows
        ]
