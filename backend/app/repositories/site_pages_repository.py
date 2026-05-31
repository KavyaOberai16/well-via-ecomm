"""Repository for the singleton company-pages document row."""
from sqlalchemy import select

from app.models.site_pages import SitePages
from app.repositories.base import BaseRepository


class SitePagesRepository(BaseRepository[SitePages]):
    model = SitePages

    def get(self) -> SitePages | None:  # type: ignore[override]
        """Return the single site_pages row, or None when the table is empty."""
        return self.db.execute(select(SitePages)).scalars().first()

    def upsert(self, data: dict) -> SitePages:
        """Create-or-update the singleton row with the supplied data dict.

        The session is NOT committed here — the service owns the transaction
        boundary so callers can chain other work before committing.
        """
        row = self.get()
        if row is None:
            row = SitePages(data=data)
            self.db.add(row)
            self.db.flush()
        else:
            row.data = data
            self.db.flush()
        return row
