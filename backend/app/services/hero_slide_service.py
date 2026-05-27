from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.models.hero_slide import HeroSlide
from app.repositories.hero_slide_repository import HeroSlideRepository
from app.schemas.hero_slide import HeroSlideUpdate
from app.storage import get_storage
from app.storage.base import CONTENT_TYPE_EXT


class HeroSlideService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = HeroSlideRepository(db)
        self.storage = get_storage()

    def list_active(self) -> list[HeroSlide]:
        return self.repo.list_active()

    def list_all(self) -> list[HeroSlide]:
        return self.repo.list_all()

    def create(
        self, file_bytes: bytes, filename: str, content_type: str, alt: str | None
    ) -> HeroSlide:
        if (content_type or "").lower() not in CONTENT_TYPE_EXT:
            raise ValidationError(f"Unsupported image type: {content_type or 'unknown'}")
        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise ValidationError(f"Image must be under {settings.MAX_IMAGE_SIZE_MB} MB")

        sort_order = self.repo.max_sort_order() + 1
        url = self.storage.save(data=file_bytes, filename=filename, content_type=content_type)
        slide = HeroSlide(image_url=url, alt=alt, sort_order=sort_order, is_active=True)
        self.repo.add(slide)
        self.db.commit()
        return self.repo.get(slide.id)

    def update(self, slide_id: int, data: HeroSlideUpdate) -> HeroSlide:
        slide = self.repo.get(slide_id)
        if not slide:
            raise NotFoundError("Hero slide not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(slide, key, value)
        self.db.commit()
        return self.repo.get(slide_id)

    def delete(self, slide_id: int) -> None:
        slide = self.repo.get(slide_id)
        if not slide:
            raise NotFoundError("Hero slide not found")
        try:
            self.storage.delete(slide.image_url)
        except Exception:
            pass
        self.repo.delete(slide)
        self.db.commit()

    def reorder(self, ids: list[int]) -> list[HeroSlide]:
        slides_by_id = {s.id: s for s in self.repo.get_many(ids)}
        for position, slide_id in enumerate(ids):
            if slide_id in slides_by_id:
                slides_by_id[slide_id].sort_order = position
        self.db.commit()
        return self.repo.list_all()
