from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.product import Product, ProductImage
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate
from app.storage import get_storage
from app.storage.base import CONTENT_TYPE_EXT


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)
        self.storage = get_storage()

    def create(self, data: ProductCreate) -> Product:
        if self.repo.get_by_sku(data.sku):
            raise ConflictError(f"SKU {data.sku} already exists")
        product = Product(**data.model_dump())
        self.repo.add(product)
        self.db.commit()
        return self.get(product.id)

    def get(self, product_id: int) -> Product:
        product = self.repo.get_with_images(product_id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    def update(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get(product_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(product, key, value)
        self.db.commit()
        return self.get(product_id)

    def delete(self, product_id: int) -> None:
        product = self.get(product_id)
        for image in list(product.images):
            self.storage.delete(image.url)
        self.repo.delete(product)
        self.db.commit()

    def search(
        self, *, q: str | None, category_id: int | None, offset: int, limit: int
    ) -> tuple[list[Product], int]:
        return self.repo.search(q=q, category_id=category_id, offset=offset, limit=limit)

    # ---- Images ----

    def add_images(
        self, product_id: int, files: list[tuple[bytes, str, str]]
    ) -> Product:
        """Attach uploaded images. `files` is a list of (data, filename, content_type)."""
        product = self.get(product_id)
        if not files:
            raise ValidationError("No image files were provided")
        if len(product.images) + len(files) > settings.MAX_PRODUCT_IMAGES:
            raise ConflictError(
                f"A product can have at most {settings.MAX_PRODUCT_IMAGES} images"
            )

        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        for data, _filename, content_type in files:
            if (content_type or "").lower() not in CONTENT_TYPE_EXT:
                raise ValidationError(f"Unsupported image type: {content_type or 'unknown'}")
            if len(data) > max_bytes:
                raise ValidationError(
                    f"Each image must be under {settings.MAX_IMAGE_SIZE_MB} MB"
                )

        next_position = max((img.position for img in product.images), default=-1) + 1
        for data, filename, content_type in files:
            url = self.storage.save(data=data, filename=filename, content_type=content_type)
            product.images.append(
                ProductImage(url=url, position=next_position, is_primary=False)
            )
            next_position += 1

        self.db.flush()
        self._sync_primary(product)
        self.db.commit()
        return self.get(product_id)

    def delete_image(self, product_id: int, image_id: int) -> Product:
        product = self.get(product_id)
        image = next((img for img in product.images if img.id == image_id), None)
        if image is None:
            raise NotFoundError("Image not found")

        self.storage.delete(image.url)
        product.images.remove(image)
        self.db.flush()
        self._sync_primary(product)
        self.db.commit()
        return self.get(product_id)

    def set_primary_image(self, product_id: int, image_id: int) -> Product:
        product = self.get(product_id)
        if not any(img.id == image_id for img in product.images):
            raise NotFoundError("Image not found")

        for img in product.images:
            img.is_primary = img.id == image_id
        self.db.flush()
        self._sync_primary(product)
        self.db.commit()
        return self.get(product_id)

    def _sync_primary(self, product: Product) -> None:
        """Ensure exactly one primary image and mirror its URL onto the product."""
        images = sorted(product.images, key=lambda i: i.position)
        if not images:
            product.image_url = None
            return
        primary = next((img for img in images if img.is_primary), None)
        if primary is None:
            primary = images[0]
            primary.is_primary = True
        product.image_url = primary.url
