from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter()


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return CategoryService(db).list()


@router.post(
    "",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    return CategoryService(db).create(payload)


@router.patch(
    "/{category_id}",
    response_model=CategoryRead,
    dependencies=[Depends(require_admin)],
)
def update_category(
    category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)
):
    return CategoryService(db).update(category_id, payload)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    CategoryService(db).delete(category_id)
