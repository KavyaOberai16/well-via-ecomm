import re

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.product import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "category"


class CategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CategoryRepository(db)

    def list(self) -> list[Category]:
        return self.repo.list_all()

    def create(self, data: CategoryCreate) -> Category:
        slug = slugify(data.slug or data.name)
        if self.repo.get_by_slug(slug):
            raise ConflictError(f"Category slug '{slug}' already exists")
        if self.repo.get_by_name(data.name):
            raise ConflictError(f"Category '{data.name}' already exists")

        category = Category(name=data.name, slug=slug)
        self.repo.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category_id: int, data: CategoryUpdate) -> Category:
        category = self.repo.get(category_id)
        if not category:
            raise NotFoundError("Category not found")

        payload = data.model_dump(exclude_unset=True)
        if payload.get("name"):
            category.name = payload["name"]
        if payload.get("slug"):
            new_slug = slugify(payload["slug"])
            clash = self.repo.get_by_slug(new_slug)
            if clash and clash.id != category.id:
                raise ConflictError(f"Category slug '{new_slug}' already exists")
            category.slug = new_slug

        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category_id: int) -> None:
        # The products.category_id FK is ON DELETE SET NULL — products survive.
        category = self.repo.get(category_id)
        if not category:
            raise NotFoundError("Category not found")
        self.repo.delete(category)
        self.db.commit()
