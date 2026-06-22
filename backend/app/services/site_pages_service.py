"""Company/content pages service.

Owns the single-row company-pages document. The public storefront reads
through `get()`, which always returns a fully-populated document (falling back
to hard-coded defaults when no row exists). Admin `update()` replaces the
document after Pydantic validation.

Mirrors `footer_service.py` exactly.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.site_pages_repository import SitePagesRepository
from app.schemas.site_pages import DEFAULT_SITE_PAGES, SitePagesUpdate


class SitePagesService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SitePagesRepository(db)

    def get(self) -> dict:
        """Return the stored document, merged with defaults for any missing
        top-level page. A shallow merge is enough because the admin PUT always
        sends the full document.
        """
        row = self.repo.get()
        stored: dict = (row.data or {}) if row is not None else {}
        if not stored:
            return dict(DEFAULT_SITE_PAGES)
        # Backfill any top-level pages added after a row was first saved.
        merged = dict(DEFAULT_SITE_PAGES)
        merged.update(stored)
        return merged

    def update(self, payload: SitePagesUpdate) -> dict:
        """Validate and replace the company-pages document. Commits the session."""
        data = payload.model_dump()
        self.repo.upsert(data)
        self.db.commit()
        return data
