from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.core.rate_limit import get_client_ip
from app.models.user import User
from app.schemas.coupon import CouponCreate, CouponRead, CouponUpdate
from app.services.audit_service import AuditService
from app.services.coupon_service import CouponService

router = APIRouter()


@router.get(
    "",
    response_model=list[CouponRead],
    dependencies=[Depends(require_permission("coupons.view"))],
)
def list_coupons(db: Session = Depends(get_db)):
    return CouponService(db).list_all()


@router.post(
    "",
    response_model=CouponRead,
    status_code=status.HTTP_201_CREATED,
)
def create_coupon(
    payload: CouponCreate,
    request: Request,
    actor: User = Depends(require_permission("coupons.create")),
    db: Session = Depends(get_db),
):
    coupon = CouponService(db).create(payload)
    AuditService(db).record(
        actor=actor,
        actor_ip=get_client_ip(request),
        action="coupon.create",
        target_type="coupon",
        target_id=coupon.id,
        target_label=coupon.code,
        summary=f"Created coupon {coupon.code}",
        extra={
            "discount_type": coupon.discount_type.value
            if hasattr(coupon.discount_type, "value")
            else str(coupon.discount_type),
            "discount_value": float(coupon.discount_value),
            "expires_at": coupon.expires_at.isoformat() if coupon.expires_at else None,
            "usage_limit": coupon.usage_limit,
            "per_user_limit": coupon.per_user_limit,
        },
    )
    db.commit()
    return coupon


@router.get(
    "/{coupon_id}",
    response_model=CouponRead,
    dependencies=[Depends(require_permission("coupons.view"))],
)
def get_coupon(coupon_id: int, db: Session = Depends(get_db)):
    return CouponService(db).get(coupon_id)


@router.patch(
    "/{coupon_id}",
    response_model=CouponRead,
)
def update_coupon(
    coupon_id: int,
    payload: CouponUpdate,
    request: Request,
    actor: User = Depends(require_permission("coupons.update")),
    db: Session = Depends(get_db),
):
    # Snapshot the keys we're allowed to change so the audit row shows a real
    # before/after — not just the new state.
    before = CouponService(db).get(coupon_id)
    before_snapshot = {
        "discount_value": float(before.discount_value),
        "is_active": before.is_active,
        "usage_limit": before.usage_limit,
        "per_user_limit": before.per_user_limit,
        "expires_at": before.expires_at.isoformat() if before.expires_at else None,
    }
    coupon = CouponService(db).update(coupon_id, payload)
    after_snapshot = {
        "discount_value": float(coupon.discount_value),
        "is_active": coupon.is_active,
        "usage_limit": coupon.usage_limit,
        "per_user_limit": coupon.per_user_limit,
        "expires_at": coupon.expires_at.isoformat() if coupon.expires_at else None,
    }
    diff = {
        k: {"before": before_snapshot[k], "after": after_snapshot[k]}
        for k in after_snapshot
        if before_snapshot[k] != after_snapshot[k]
    }
    AuditService(db).record(
        actor=actor,
        actor_ip=get_client_ip(request),
        action="coupon.update",
        target_type="coupon",
        target_id=coupon.id,
        target_label=coupon.code,
        summary=f"Updated coupon {coupon.code}"
        + (f" ({', '.join(diff.keys())})" if diff else ""),
        extra={"changes": diff} if diff else None,
    )
    db.commit()
    return coupon


@router.delete(
    "/{coupon_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_coupon(
    coupon_id: int,
    request: Request,
    actor: User = Depends(require_permission("coupons.delete")),
    db: Session = Depends(get_db),
):
    coupon = CouponService(db).get(coupon_id)
    code = coupon.code
    CouponService(db).delete(coupon_id)
    AuditService(db).record(
        actor=actor,
        actor_ip=get_client_ip(request),
        action="coupon.delete",
        target_type="coupon",
        target_id=coupon_id,
        target_label=code,
        summary=f"Deleted coupon {code}",
    )
    db.commit()
