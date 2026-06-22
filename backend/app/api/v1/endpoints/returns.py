"""Customer + admin endpoints for the returns workflow.

Two FastAPI routers exported:

  * `customer_router` mounted at `/returns`        — create, list, detail, cancel
  * `admin_router`    mounted at `/returns/admin`  — list, approve/reject/etc.

The admin endpoints all audit through the existing AuditService so reverse-
pickup ops show up in the same admin log as order refunds.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_permission
from app.core.rate_limit import get_client_ip
from app.models.return_request import ReturnRequest
from app.models.user import User
from app.schemas.return_request import (
    AdminReturnCustomerBrief,
    AdminReturnDecisionRequest,
    AdminReturnRead,
    ReturnCreateRequest,
    ReturnItemRead,
    ReturnRead,
)
from app.services.audit_service import AuditService
from app.services.return_service import ReturnService

customer_router = APIRouter()
admin_router = APIRouter()


def _customer(req: ReturnRequest) -> ReturnRead:
    return ReturnRead(
        id=req.id,
        order_id=req.order_id,
        status=req.status.value,
        reason=req.reason,
        customer_notes=req.customer_notes,
        reverse_awb=req.reverse_awb,
        refund_amount=req.refund_amount,
        requested_at=req.requested_at,
        approved_at=req.approved_at,
        rejected_at=req.rejected_at,
        picked_up_at=req.picked_up_at,
        received_at=req.received_at,
        refunded_at=req.refunded_at,
        cancelled_at=req.cancelled_at,
        items=[ReturnItemRead.model_validate(i) for i in req.items],
    )


def _admin(req: ReturnRequest) -> AdminReturnRead:
    return AdminReturnRead(
        id=req.id,
        order_id=req.order_id,
        status=req.status.value,
        reason=req.reason,
        customer_notes=req.customer_notes,
        admin_notes=req.admin_notes,
        reverse_awb=req.reverse_awb,
        reverse_pickup_id=req.reverse_pickup_id,
        refund_amount=req.refund_amount,
        requested_at=req.requested_at,
        approved_at=req.approved_at,
        rejected_at=req.rejected_at,
        picked_up_at=req.picked_up_at,
        received_at=req.received_at,
        refunded_at=req.refunded_at,
        cancelled_at=req.cancelled_at,
        items=[ReturnItemRead.model_validate(i) for i in req.items],
        customer=AdminReturnCustomerBrief.model_validate(req.user),
    )


def _audit_return(
    db: Session,
    actor: User,
    request: Request,
    action: str,
    req: ReturnRequest,
    *,
    summary: str,
    extra: dict[str, Any] | None = None,
) -> None:
    AuditService(db).record(
        actor=actor,
        actor_ip=get_client_ip(request),
        action=action,
        target_type="return",
        target_id=req.id,
        target_label=f"return#{req.id}",
        summary=summary,
        extra=extra,
    )


# ---- Customer routes -------------------------------------------------------


@customer_router.post(
    "",
    response_model=ReturnRead,
    status_code=201,
)
def create_return(
    payload: ReturnCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = ReturnService(db).create_return(
        user_id=user.id,
        order_id=payload.order_id,
        items=[(i.order_item_id, i.quantity) for i in payload.items],
        reason=payload.reason,
        customer_notes=payload.customer_notes,
    )
    db.commit()
    return _customer(req)


@customer_router.get("", response_model=list[ReturnRead])
def list_my_returns(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return [_customer(r) for r in ReturnService(db).list_for_user(user.id)]


@customer_router.get("/{return_id}", response_model=ReturnRead)
def get_my_return(
    return_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _customer(ReturnService(db).get_for_user(user.id, return_id))


@customer_router.post("/{return_id}/cancel", response_model=ReturnRead)
def cancel_my_return(
    return_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = ReturnService(db).cancel_by_customer(user_id=user.id, return_id=return_id)
    db.commit()
    return _customer(req)


# ---- Admin routes ----------------------------------------------------------


@admin_router.get("", response_model=list[AdminReturnRead])
def admin_list_returns(
    status: str | None = Query(default=None),
    _actor: User = Depends(require_permission("returns.view_all")),
    db: Session = Depends(get_db),
):
    return [_admin(r) for r in ReturnService(db).list_all(status=status)]


@admin_router.get("/{return_id}", response_model=AdminReturnRead)
def admin_get_return(
    return_id: int,
    _actor: User = Depends(require_permission("returns.view_all")),
    db: Session = Depends(get_db),
):
    return _admin(ReturnService(db).admin_get(return_id))


@admin_router.post("/{return_id}/approve", response_model=AdminReturnRead)
def admin_approve_return(
    return_id: int,
    payload: AdminReturnDecisionRequest,
    request: Request,
    actor: User = Depends(require_permission("returns.manage")),
    db: Session = Depends(get_db),
):
    req = ReturnService(db).approve(
        return_id,
        admin_notes=payload.admin_notes,
        refund_amount=payload.refund_amount,
    )
    _audit_return(
        db, actor, request, "return.approve", req,
        summary=(
            f"Approved return #{req.id} on order #{req.order_id}"
            + (f" (reverse AWB {req.reverse_awb})" if req.reverse_awb else "")
        ),
        extra={
            "refund_amount": float(req.refund_amount or 0),
            "reverse_awb": req.reverse_awb,
        },
    )
    db.commit()
    return _admin(req)


@admin_router.post("/{return_id}/reject", response_model=AdminReturnRead)
def admin_reject_return(
    return_id: int,
    payload: AdminReturnDecisionRequest,
    request: Request,
    actor: User = Depends(require_permission("returns.manage")),
    db: Session = Depends(get_db),
):
    req = ReturnService(db).reject(return_id, admin_notes=payload.admin_notes)
    _audit_return(
        db, actor, request, "return.reject", req,
        summary=f"Rejected return #{req.id} on order #{req.order_id}",
        extra={"admin_notes": payload.admin_notes},
    )
    db.commit()
    return _admin(req)


@admin_router.post("/{return_id}/mark-picked-up", response_model=AdminReturnRead)
def admin_mark_picked_up(
    return_id: int,
    request: Request,
    actor: User = Depends(require_permission("returns.manage")),
    db: Session = Depends(get_db),
):
    req = ReturnService(db).mark_picked_up(return_id)
    _audit_return(
        db, actor, request, "return.picked_up", req,
        summary=f"Marked return #{req.id} picked up",
    )
    db.commit()
    return _admin(req)


@admin_router.post("/{return_id}/mark-received", response_model=AdminReturnRead)
def admin_mark_received(
    return_id: int,
    request: Request,
    actor: User = Depends(require_permission("returns.manage")),
    db: Session = Depends(get_db),
):
    req = ReturnService(db).mark_received(return_id)
    _audit_return(
        db, actor, request, "return.received", req,
        summary=f"Marked return #{req.id} received at warehouse",
    )
    db.commit()
    return _admin(req)


@admin_router.post("/{return_id}/mark-refunded", response_model=AdminReturnRead)
def admin_mark_refunded(
    return_id: int,
    request: Request,
    actor: User = Depends(require_permission("returns.manage")),
    db: Session = Depends(get_db),
):
    req = ReturnService(db).mark_refunded(return_id)
    _audit_return(
        db, actor, request, "return.refunded", req,
        summary=(
            f"Refunded return #{req.id} for "
            f"{float(req.refund_amount or 0):.2f}"
        ),
        extra={"refund_amount": float(req.refund_amount or 0)},
    )
    db.commit()
    return _admin(req)
