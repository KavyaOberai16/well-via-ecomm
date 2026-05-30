"""Footer configuration service.

Owns the single-row footer config. The public storefront reads through
`get()`, which always returns a fully-populated document (falling back to
hard-coded defaults when no row exists). Admin `update()` replaces the
document after Pydantic validation.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.footer_repository import FooterRepository
from app.schemas.footer import DEFAULT_FOOTER, FooterConfigUpdate


class FooterService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = FooterRepository(db)

    def get(self) -> dict:
        """Return the stored footer data, merged with defaults for any
        missing top-level keys.  A shallow merge is enough because the
        admin PUT always sends the full document.
        """
        row = self.repo.get()
        stored: dict = (row.data or {}) if row is not None else {}
        if not stored:
            return dict(DEFAULT_FOOTER)
        # Backfill any top-level keys added after a row was first saved.
        merged = dict(DEFAULT_FOOTER)
        merged.update(stored)
        return merged

    def update(self, payload: FooterConfigUpdate) -> dict:
        """Validate and replace the footer document.  Commits the session."""
        data = payload.model_dump()
        self.repo.upsert(data)
        self.db.commit()
        return data
