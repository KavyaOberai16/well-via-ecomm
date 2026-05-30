from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class HeroSlide(Base, IDMixin, TimestampMixin):
    __tablename__ = "hero_slides"

    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    alt: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # --- carousel upgrade columns ---
    kind: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="photo", default="photo"
    )
    heading: Mapped[str | None] = mapped_column(String(200), nullable=True)
    subtext: Mapped[str | None] = mapped_column(String(400), nullable=True)
    badge_text: Mapped[str | None] = mapped_column(String(80), nullable=True)
    cta_label: Mapped[str | None] = mapped_column(String(80), nullable=True)
    cta_href: Mapped[str | None] = mapped_column(String(512), nullable=True)
    countdown_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    text_theme: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="light", default="light"
    )

    __table_args__ = (
        Index("ix_hero_slides_is_active_sort_order", "is_active", "sort_order"),
    )
