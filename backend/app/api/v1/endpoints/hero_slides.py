from fastapi import APIRouter, Depends, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.schemas.hero_slide import HeroSlideRead, HeroSlideReorder, HeroSlideUpdate
from app.services.hero_slide_service import HeroSlideService

router = APIRouter()


@router.get("", response_model=list[HeroSlideRead])
def list_hero_slides(db: Session = Depends(get_db)):
    return HeroSlideService(db).list_active()


@router.get("/all", response_model=list[HeroSlideRead], dependencies=[Depends(require_admin)])
def list_all_hero_slides(db: Session = Depends(get_db)):
    return HeroSlideService(db).list_all()


@router.post(
    "",
    response_model=HeroSlideRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_hero_slide(
    file: UploadFile,
    alt: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    return HeroSlideService(db).create(
        file_bytes=file_bytes,
        filename=file.filename or "image",
        content_type=file.content_type or "",
        alt=alt,
    )


@router.patch(
    "/{slide_id}",
    response_model=HeroSlideRead,
    dependencies=[Depends(require_admin)],
)
def update_hero_slide(
    slide_id: int, payload: HeroSlideUpdate, db: Session = Depends(get_db)
):
    return HeroSlideService(db).update(slide_id, payload)


@router.delete(
    "/{slide_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_hero_slide(slide_id: int, db: Session = Depends(get_db)):
    HeroSlideService(db).delete(slide_id)


@router.post(
    "/reorder",
    response_model=list[HeroSlideRead],
    dependencies=[Depends(require_admin)],
)
def reorder_hero_slides(payload: HeroSlideReorder, db: Session = Depends(get_db)):
    return HeroSlideService(db).reorder(payload.ids)
