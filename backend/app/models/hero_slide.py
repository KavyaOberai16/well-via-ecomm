from sqlalchemy import Boolean, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class HeroSlide(Base, IDMixin, TimestampMixin):
    __tablename__ = "hero_slides"

    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    alt: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    __table_args__ = (
        Index("ix_hero_slides_is_active_sort_order", "is_active", "sort_order"),
    )
