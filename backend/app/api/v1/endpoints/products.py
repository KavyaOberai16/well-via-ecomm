from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.schemas.common import Page, PaginationParams
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter()


@router.get("", response_model=Page[ProductRead])
def list_products(
    q: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    pagination = PaginationParams(page=page, page_size=page_size)
    items, total = ProductService(db).search(
        q=q, category_id=category_id, offset=pagination.offset, limit=pagination.page_size
    )
    return Page[ProductRead](
        items=[ProductRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return ProductService(db).get(product_id)


@router.post(
    "",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return ProductService(db).create(payload)


@router.patch(
    "/{product_id}",
    response_model=ProductRead,
    dependencies=[Depends(require_admin)],
)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    return ProductService(db).update(product_id, payload)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    ProductService(db).delete(product_id)


@router.post(
    "/{product_id}/images",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def upload_product_images(
    product_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    payloads = [
        (await f.read(), f.filename or "image", f.content_type or "")
        for f in files
    ]
    return ProductService(db).add_images(product_id, payloads)


@router.delete(
    "/{product_id}/images/{image_id}",
    response_model=ProductRead,
    dependencies=[Depends(require_admin)],
)
def delete_product_image(
    product_id: int, image_id: int, db: Session = Depends(get_db)
):
    return ProductService(db).delete_image(product_id, image_id)


@router.post(
    "/{product_id}/images/{image_id}/primary",
    response_model=ProductRead,
    dependencies=[Depends(require_admin)],
)
def set_primary_product_image(
    product_id: int, image_id: int, db: Session = Depends(get_db)
):
    return ProductService(db).set_primary_image(product_id, image_id)
