from sqlalchemy import desc, func, select
from sqlalchemy.orm import joinedload

from app.models.review import Review
from app.repositories.base import BaseRepository


class ReviewRepository(BaseRepository[Review]):
    model = Review

    def list_for_product(
        self,
        product_id: int,
        *,
        offset: int = 0,
        limit: int = 20,
        sort: str = "newest",
        approved_only: bool = True,
    ) -> tuple[list[Review], int]:
        stmt = select(Review).where(Review.product_id == product_id)
        count_stmt = (
            select(func.count()).select_from(Review).where(Review.product_id == product_id)
        )
        if approved_only:
            stmt = stmt.where(Review.is_approved == True)  # noqa: E712
            count_stmt = count_stmt.where(Review.is_approved == True)  # noqa: E712

        # "top" prioritises high ratings, then recency, then helpfulness.
        if sort == "top":
            stmt = stmt.order_by(
                desc(Review.rating),
                desc(Review.helpful_count),
                desc(Review.created_at),
            )
        else:  # newest
            stmt = stmt.order_by(desc(Review.created_at), desc(Review.id))

        # Eager-load user so we don't N+1 on the author name lookup.
        stmt = stmt.options(joinedload(Review.user))

        total = self.db.execute(count_stmt).scalar_one()
        items = list(
            self.db.execute(stmt.offset(offset).limit(limit)).unique().scalars().all()
        )
        return items, total

    def list_admin(
        self,
        *,
        q: str | None = None,
        product_id: int | None = None,
        rating: int | None = None,
        approved: bool | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Review], int]:
        stmt = select(Review).options(joinedload(Review.user))
        count_stmt = select(func.count()).select_from(Review)
        if q:
            like = f"%{q.strip()}%"
            from sqlalchemy import or_

            cond = or_(Review.title.ilike(like), Review.body.ilike(like), Review.author_name.ilike(like))
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)
        if product_id is not None:
            stmt = stmt.where(Review.product_id == product_id)
            count_stmt = count_stmt.where(Review.product_id == product_id)
        if rating is not None:
            stmt = stmt.where(Review.rating == rating)
            count_stmt = count_stmt.where(Review.rating == rating)
        if approved is not None:
            stmt = stmt.where(Review.is_approved == approved)
            count_stmt = count_stmt.where(Review.is_approved == approved)

        total = self.db.execute(count_stmt).scalar_one()
        items = list(
            self.db.execute(
                stmt.order_by(desc(Review.created_at), desc(Review.id))
                .offset(offset)
                .limit(limit)
            )
            .unique()
            .scalars()
            .all()
        )
        return items, total

    def find_user_review(self, product_id: int, user_id: int) -> Review | None:
        stmt = select(Review).where(
            Review.product_id == product_id, Review.user_id == user_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def aggregate_for_product(
        self, product_id: int
    ) -> tuple[int, float | None, dict[str, int]]:
        """Returns (count, avg, distribution{"1".."5"}) for approved reviews."""
        # Only approved reviews count toward the public-facing aggregate.
        approved_filter = (Review.product_id == product_id, Review.is_approved == True)  # noqa: E712

        count, avg = self.db.execute(
            select(func.count(Review.id), func.avg(Review.rating)).where(*approved_filter)
        ).one()

        rows = self.db.execute(
            select(Review.rating, func.count(Review.id))
            .where(*approved_filter)
            .group_by(Review.rating)
        ).all()
        distribution = {str(i): 0 for i in range(1, 6)}
        for rating, n in rows:
            distribution[str(rating)] = int(n)
        return int(count or 0), float(avg) if avg is not None else None, distribution
