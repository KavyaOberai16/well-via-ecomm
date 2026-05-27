from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_permission
from app.core.exceptions import NotFoundError
from app.core.rate_limit import get_client_ip
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.common import PaginationParams
from app.schemas.order import (
    AdminCustomerBrief,
    AdminOrderListPage,
    AdminOrderRead,
    AdminOrderRow,
    NotesRequest,
    OrderCreate,
    OrderItemRead,
    OrderRead,
    RefundOrCancelRequest,
    ShipRequest,
)
from app.services.audit_service import AuditService
from app.services.order_service import OrderService

router = APIRouter()


def _row(order: Order) -> AdminOrderRow:
    return AdminOrderRow(
        id=order.id,
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        customer_email=order.user.email if order.user else "—",
        item_count=len(order.items) if order.items is not None else 0,
        created_at=order.created_at,
    )


def _detail(order: Order) -> AdminOrderRead:
    return AdminOrderRead(
        id=order.id,
        status=order.status,
        subtotal=order.subtotal,
        tax_amount=order.tax_amount,
        discount_amount=order.discount_amount,
        total_amount=order.total_amount,
        coupon_code=order.coupon_code,
        currency=order.currency,
        shipping_address=order.shipping_address,
        payment_intent_id=order.payment_intent_id,
        items=[OrderItemRead.model_validate(i) for i in order.items],
        customer=AdminCustomerBrief.model_validate(order.user),
        tracking_number=order.tracking_number,
        carrier=order.carrier,
        paid_at=order.paid_at,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at,
        cancelled_at=order.cancelled_at,
        refunded_at=order.refunded_at,
        refund_reason=order.refund_reason,
        internal_notes=order.internal_notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def _audit_order(
    db: Session,
    actor: User,
    request: Request,
    action: str,
    order: Order,
    *,
    summary: str,
    extra: dict[str, Any] | None = None,
) -> None:
    AuditService(db).record(
        actor=actor,
        actor_ip=get_client_ip(request),
        action=action,
        target_type="order",
        target_id=order.id,
        target_label=f"order#{order.id}",
        summary=summary,
        extra=extra,
    )


# ---- ADMIN ROUTES (must appear before /{order_id} so the dynamic route
#      doesn't shadow them) ----


@router.get(
    "/admin",
    response_model=AdminOrderListPage,
)
def admin_list_orders(
    q: str | None = Query(default=None, description="Match order id or customer email"),
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    _actor: User = Depends(require_permission("orders.view_all")),
    db: Session = Depends(get_db),
):
    svc = OrderService(db)
    offset = (page - 1) * page_size
    items, total = svc.admin_search(
        q=q,
        status=status_filter,
        date_from=date_from,
        date_to=date_to,
        offset=offset,
        limit=page_size,
    )
    return AdminOrderListPage(
        items=[_row(o) for o in items],
        total=total,
        page=page,
        page_size=page_size,
        counts_by_status=svc.counts_by_status(),
    )


@router.get(
    "/admin/{order_id}",
    response_model=AdminOrderRead,
)
def admin_get_order(
    order_id: int,
    _actor: User = Depends(require_permission("orders.view_all")),
    db: Session = Depends(get_db),
):
    return _detail(OrderService(db).admin_get(order_id))


@router.post("/admin/{order_id}/ship", response_model=AdminOrderRead)
def admin_ship_order(
    order_id: int,
    payload: ShipRequest,
    request: Request,
    actor: User = Depends(require_permission("orders.update_status")),
    db: Session = Depends(get_db),
):
    svc = OrderService(db)
    order = svc.mark_shipped(
        order_id,
        tracking_number=payload.tracking_number,
        carrier=payload.carrier,
    )
    _audit_order(
        db,
        actor,
        request,
        "order.ship",
        order,
        summary=(
            f"Shipped order #{order.id}"
            + (f" via {order.carrier}" if order.carrier else "")
            + (f" ({order.tracking_number})" if order.tracking_number else "")
        ),
        extra={
            "tracking_number": order.tracking_number,
            "carrier": order.carrier,
        },
    )
    db.commit()
    return _detail(order)


@router.post("/admin/{order_id}/deliver", response_model=AdminOrderRead)
def admin_deliver_order(
    order_id: int,
    request: Request,
    actor: User = Depends(require_permission("orders.update_status")),
    db: Session = Depends(get_db),
):
    order = OrderService(db).mark_delivered(order_id)
    _audit_order(
        db,
        actor,
        request,
        "order.deliver",
        order,
        summary=f"Marked order #{order.id} delivered",
    )
    db.commit()
    return _detail(order)


@router.post("/admin/{order_id}/cancel", response_model=AdminOrderRead)
def admin_cancel_order(
    order_id: int,
    payload: RefundOrCancelRequest,
    request: Request,
    actor: User = Depends(require_permission("orders.refund")),
    db: Session = Depends(get_db),
):
    order = OrderService(db).cancel(order_id, reason=payload.reason)
    _audit_order(
        db,
        actor,
        request,
        "order.cancel",
        order,
        summary=f"Cancelled order #{order.id}: {payload.reason}",
        extra={"reason": payload.reason},
    )
    db.commit()
    return _detail(order)


@router.post("/admin/{order_id}/refund", response_model=AdminOrderRead)
def admin_refund_order(
    order_id: int,
    payload: RefundOrCancelRequest,
    request: Request,
    actor: User = Depends(require_permission("orders.refund")),
    db: Session = Depends(get_db),
):
    order = OrderService(db).refund(order_id, reason=payload.reason)
    _audit_order(
        db,
        actor,
        request,
        "order.refund",
        order,
        summary=f"Refunded order #{order.id}: {payload.reason}",
        extra={"reason": payload.reason, "total": float(order.total_amount)},
    )
    db.commit()
    return _detail(order)


@router.patch("/admin/{order_id}/notes", response_model=AdminOrderRead)
def admin_update_notes(
    order_id: int,
    payload: NotesRequest,
    request: Request,
    actor: User = Depends(require_permission("orders.update_status")),
    db: Session = Depends(get_db),
):
    order = OrderService(db).update_notes(order_id, payload.internal_notes)
    _audit_order(
        db,
        actor,
        request,
        "order.notes_update",
        order,
        summary=f"Updated internal notes on order #{order.id}",
    )
    db.commit()
    return _detail(order)


# ---- USER ROUTES ----


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return OrderService(db).create(user.id, payload)


@router.get("", response_model=list[OrderRead])
def list_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = PaginationParams(page=page, page_size=page_size)
    return OrderService(db).list_for_user(user.id, offset=p.offset, limit=p.page_size)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return OrderService(db).get_for_user(user.id, order_id)
