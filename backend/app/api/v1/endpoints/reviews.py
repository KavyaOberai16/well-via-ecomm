"""Review endpoints.

Three audiences:
  - Public:     GET /products/{id}/reviews  (paginated, approved only)
  - User:       POST/PATCH/DELETE for their own review
  - Admin:      full CRUD + filtering, can create as any author or arbitrary user
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_permission
from app.models.user import User
from app.schemas.review import (
    AdminReviewCreate,
    AdminReviewUpdate,
    ReviewCreate,
    ReviewListPage,
    ReviewRead,
    ReviewUpdate,
)
from app.services.review_service import ReviewService

# Two routers — one is mounted under /products (public + user create), the
# other under /reviews (user edit/delete + admin CRUD).
public_router = APIRouter()
admin_router = APIRouter()


# ---- Public / user ----


@public_router.get("/{product_id}/reviews", response_model=ReviewListPage)
def list_product_reviews(
    product_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    sort: str = Query(default="newest", pattern="^(newest|top)$"),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    items, total = ReviewService(db).list_for_product(
        product_id, offset=offset, limit=page_size, sort=sort, approved_only=True
    )
    return ReviewListPage(
        items=[ReviewRead.from_orm_review(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@public_router.post(
    "/{product_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    product_id: int,
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = ReviewService(db).create_for_user(
        user, product_id, payload.rating, payload.title, payload.body
    )
    return ReviewRead.from_orm_review(review)


@admin_router.patch("/{review_id}", response_model=ReviewRead)
def update_own_review(
    review_id: int,
    payload: ReviewUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = ReviewService(db).update_own(
        user,
        review_id,
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
    )
    return ReviewRead.from_orm_review(review)


@admin_router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_own_review(
    review_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ReviewService(db).delete_own(user, review_id)


# ---- Admin ----


@admin_router.get(
    "/admin",
    response_model=ReviewListPage,
    dependencies=[Depends(require_permission("reviews.view"))],
)
def list_reviews_admin(
    q: str | None = Query(default=None),
    product_id: int | None = Query(default=None),
    rating: int | None = Query(default=None, ge=1, le=5),
    approved: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    items, total = ReviewService(db).list_admin(
        q=q,
        product_id=product_id,
        rating=rating,
        approved=approved,
        offset=offset,
        limit=page_size,
    )
    return ReviewListPage(
        items=[ReviewRead.from_orm_review(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@admin_router.post(
    "/admin",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("reviews.create"))],
)
def admin_create_review(payload: AdminReviewCreate, db: Session = Depends(get_db)):
    review = ReviewService(db).admin_create(
        product_id=payload.product_id,
        rating=payload.rating,
        author_name=payload.author_name,
        title=payload.title,
        body=payload.body,
        is_verified_purchase=payload.is_verified_purchase,
        is_approved=payload.is_approved,
        user_id=payload.user_id,
    )
    return ReviewRead.from_orm_review(review)


@admin_router.patch(
    "/admin/{review_id}",
    response_model=ReviewRead,
    dependencies=[Depends(require_permission("reviews.update"))],
)
def admin_update_review(
    review_id: int, payload: AdminReviewUpdate, db: Session = Depends(get_db)
):
    review = ReviewService(db).admin_update(
        review_id,
        rating=payload.rating,
        author_name=payload.author_name,
        title=payload.title,
        body=payload.body,
        is_verified_purchase=payload.is_verified_purchase,
        is_approved=payload.is_approved,
    )
    return ReviewRead.from_orm_review(review)


@admin_router.delete(
    "/admin/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("reviews.delete"))],
)
def admin_delete_review(review_id: int, db: Session = Depends(get_db)):
    ReviewService(db).admin_delete(review_id)
