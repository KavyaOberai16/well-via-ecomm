from sqlalchemy import func, or_, select

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def search(
        self,
        *,
        q: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[User], int]:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(or_(User.email.ilike(like), User.full_name.ilike(like)))
            count_stmt = count_stmt.where(
                or_(User.email.ilike(like), User.full_name.ilike(like))
            )
        total = self.db.execute(count_stmt).scalar_one()
        items = list(
            self.db.execute(stmt.order_by(User.id.desc()).offset(offset).limit(limit))
            .scalars()
            .all()
        )
        return items, total
