from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.cart import (
    CartItemIn,
    CartItemQuantityUpdate,
    CartRead,
    CouponApplyRequest,
)
from app.services.cart_service import CartService

router = APIRouter()


@router.get("", response_model=CartRead)
def view_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return CartService(db).get(user.id)


@router.post("/items", status_code=status.HTTP_204_NO_CONTENT)
def add_item(
    item: CartItemIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    CartService(db).add_item(user.id, item)


@router.put("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def set_item_quantity(
    product_id: int,
    payload: CartItemQuantityUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set the absolute quantity of a cart line. Body `{quantity: 0}`
    removes the line — saves the UI from switching between PUT/DELETE
    on the quantity stepper."""
    CartService(db).set_quantity(user.id, product_id, payload.quantity)


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    CartService(db).remove_item(user.id, product_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    CartService(db).clear(user.id)


@router.post("/coupon", response_model=CartRead)
def apply_coupon(
    payload: CouponApplyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CartService(db).apply_coupon(user.id, payload.code)


@router.delete("/coupon", response_model=CartRead)
def remove_coupon(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return CartService(db).remove_coupon(user.id)
