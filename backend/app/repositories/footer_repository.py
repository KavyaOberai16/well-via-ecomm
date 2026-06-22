"""Repository for the singleton footer configuration row."""
from sqlalchemy import select

from app.models.footer_config import FooterConfig
from app.repositories.base import BaseRepository


class FooterRepository(BaseRepository[FooterConfig]):
    model = FooterConfig

    def get(self) -> FooterConfig | None:  # type: ignore[override]
        """Return the single footer config row, or None when the table is empty."""
        return self.db.execute(select(FooterConfig)).scalars().first()

    def upsert(self, data: dict) -> FooterConfig:
        """Create-or-update the singleton row with the supplied data dict.

        The session is NOT committed here — the service owns the transaction
        boundary so callers can chain other work before committing.
        """
        row = self.get()
        if row is None:
            row = FooterConfig(data=data)
            self.db.add(row)
            self.db.flush()
        else:
            row.data = data
            self.db.flush()
        return row
