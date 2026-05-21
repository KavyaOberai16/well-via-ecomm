from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.cart import CartItemIn, CartRead
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
