from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Review(Base, IDMixin, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (
        # One review per user per product. MySQL doesn't treat NULL user_ids
        # as duplicates so admin-entered reviews (user_id=NULL) are unrestricted.
        UniqueConstraint("product_id", "user_id", name="uq_reviews_product_user"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Nullable so admins can seed reviews with arbitrary author names without
    # creating fake user accounts.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    # Fallback display name when user_id is null. Ignored otherwise — UI uses
    # `user.full_name` when a user is linked.
    author_name: Mapped[str | None] = mapped_column(String(120))
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[str | None] = mapped_column(String(160))
    body: Mapped[str | None] = mapped_column(Text)
    is_verified_purchase: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    # Default-on so admin entry doesn't sit in a moderation queue. Flip the
    # default later if you want pre-moderation.
    is_approved: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    helpful_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="reviews")
    user: Mapped["User | None"] = relationship()
