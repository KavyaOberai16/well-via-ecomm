from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.schemas.coupon import CouponCreate, CouponRead, CouponUpdate
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
    dependencies=[Depends(require_permission("coupons.create"))],
)
def create_coupon(payload: CouponCreate, db: Session = Depends(get_db)):
    return CouponService(db).create(payload)


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
    dependencies=[Depends(require_permission("coupons.update"))],
)
def update_coupon(coupon_id: int, payload: CouponUpdate, db: Session = Depends(get_db)):
    return CouponService(db).update(coupon_id, payload)


@router.delete(
    "/{coupon_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("coupons.delete"))],
)
def delete_coupon(coupon_id: int, db: Session = Depends(get_db)):
    CouponService(db).delete(coupon_id)
