"""Review CRUD + product aggregate recompute.

The product's denormalized rating_avg/rating_count/rating_distribution columns
are recomputed inside the same transaction as every review mutation, so the
storefront's listing/card queries can read them in one row without joining
back to reviews.
"""
from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.repositories.review_repository import ReviewRepository


class ReviewService:
    def __init__(self, db: Session):
        self.db = db
        self.reviews = ReviewRepository(db)
        self.products = ProductRepository(db)

    # ---- public / user-facing reads ----

    def list_for_product(
        self,
        product_id: int,
        *,
        offset: int,
        limit: int,
        sort: str,
        approved_only: bool = True,
    ) -> tuple[list[Review], int]:
        return self.reviews.list_for_product(
            product_id,
            offset=offset,
            limit=limit,
            sort=sort,
            approved_only=approved_only,
        )

    # ---- user actions ----

    def create_for_user(
        self,
        user: User,
        product_id: int,
        rating: int,
        title: str | None,
        body: str | None,
    ) -> Review:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        if self.reviews.find_user_review(product_id, user.id):
            raise ConflictError("You have already reviewed this product")
        review = Review(
            product_id=product_id,
            user_id=user.id,
            rating=rating,
            title=title,
            body=body,
            # Verified flag is derived later from the user's order history; for
            # now we leave it false unless an admin flips it.
            is_verified_purchase=False,
            is_approved=True,
        )
        self.reviews.add(review)
        self.db.flush()  # so review.id is set before loyalty references it
        self._recompute(product)
        self._award_loyalty_points(review)
        self.db.commit()
        return self.reviews.get(review.id)  # type: ignore[return-value]

    def _award_loyalty_points(self, review) -> None:
        """Hand the review to the loyalty engine. Lazy import keeps the
        module dependency direction clean."""
        from app.services.loyalty_service import LoyaltyService
        import logging

        try:
            LoyaltyService(self.db).award_for_review(review)
        except Exception as exc:
            logging.getLogger(__name__).warning(
                "loyalty award failed for review %s: %s", review.id, exc
            )

    def update_own(
        self,
        user: User,
        review_id: int,
        *,
        rating: int | None,
        title: str | None,
        body: str | None,
    ) -> Review:
        review = self._must_get(review_id)
        if review.user_id != user.id and not user.is_admin:
            raise ForbiddenError("You can only edit your own review")
        if rating is not None:
            review.rating = rating
        if title is not None:
            review.title = title
        if body is not None:
            review.body = body
        self._recompute(self.products.get(review.product_id))
        self.db.commit()
        return self.reviews.get(review_id)  # type: ignore[return-value]

    def delete_own(self, user: User, review_id: int) -> None:
        review = self._must_get(review_id)
        if review.user_id != user.id and not user.is_admin:
            raise ForbiddenError("You can only delete your own review")
        product_id = review.product_id
        self.reviews.delete(review)
        self._recompute(self.products.get(product_id))
        self.db.commit()

    # ---- admin actions ----

    def list_admin(
        self,
        *,
        q: str | None,
        product_id: int | None,
        rating: int | None,
        approved: bool | None,
        offset: int,
        limit: int,
    ) -> tuple[list[Review], int]:
        return self.reviews.list_admin(
            q=q,
            product_id=product_id,
            rating=rating,
            approved=approved,
            offset=offset,
            limit=limit,
        )

    def admin_create(
        self,
        *,
        product_id: int,
        rating: int,
        author_name: str | None,
        title: str | None,
        body: str | None,
        is_verified_purchase: bool,
        is_approved: bool,
        user_id: int | None = None,
    ) -> Review:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        if user_id is not None and self.reviews.find_user_review(product_id, user_id):
            raise ConflictError("That user has already reviewed this product")
        review = Review(
            product_id=product_id,
            user_id=user_id,
            author_name=author_name or None,
            rating=rating,
            title=title,
            body=body,
            is_verified_purchase=is_verified_purchase,
            is_approved=is_approved,
        )
        self.reviews.add(review)
        self._recompute(product)
        self.db.commit()
        return self.reviews.get(review.id)  # type: ignore[return-value]

    def admin_update(
        self,
        review_id: int,
        *,
        rating: int | None = None,
        author_name: str | None = None,
        title: str | None = None,
        body: str | None = None,
        is_verified_purchase: bool | None = None,
        is_approved: bool | None = None,
    ) -> Review:
        review = self._must_get(review_id)
        if rating is not None:
            review.rating = rating
        if author_name is not None:
            review.author_name = author_name or None
        if title is not None:
            review.title = title
        if body is not None:
            review.body = body
        if is_verified_purchase is not None:
            review.is_verified_purchase = is_verified_purchase
        if is_approved is not None:
            review.is_approved = is_approved
        self._recompute(self.products.get(review.product_id))
        self.db.commit()
        return self.reviews.get(review_id)  # type: ignore[return-value]

    def admin_delete(self, review_id: int) -> None:
        review = self._must_get(review_id)
        product_id = review.product_id
        self.reviews.delete(review)
        self._recompute(self.products.get(product_id))
        self.db.commit()

    # ---- internals ----

    def _must_get(self, review_id: int) -> Review:
        review = self.reviews.get(review_id)
        if not review:
            raise NotFoundError("Review not found")
        return review

    def _recompute(self, product: Product | None) -> None:
        if product is None:
            return
        count, avg, distribution = self.reviews.aggregate_for_product(product.id)
        product.rating_count = count
        product.rating_avg = (
            Decimal(str(avg or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        )
        product.rating_distribution = distribution if count else None
        self.db.flush()
