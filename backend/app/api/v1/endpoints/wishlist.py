from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.wishlist import WishlistAdd, WishlistItemRead
from app.services.wishlist_service import WishlistService

router = APIRouter()


@router.get("", response_model=list[WishlistItemRead])
def list_wishlist(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return WishlistService(db).list_for_user(user.id)


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
def add_to_wishlist(
    payload: WishlistAdd,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    WishlistService(db).add(user.id, payload.product_id)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    WishlistService(db).remove(user.id, product_id)
