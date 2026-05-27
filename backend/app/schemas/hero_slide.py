from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HeroSlideRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    alt: str | None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class HeroSlideUpdate(BaseModel):
    alt: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class HeroSlideReorder(BaseModel):
    ids: list[int]
