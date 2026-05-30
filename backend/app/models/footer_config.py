"""Storefront footer configuration — a single-row JSON document table.

One row holds the entire footer document (links, columns, social handles,
copyright text, etc.). The service layer reads this row and merges in
application defaults when the row is absent, so the table starts empty.
"""
from __future__ import annotations

from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class FooterConfig(Base, IDMixin, TimestampMixin):
    __tablename__ = "footer_config"

    # The complete footer document. Use `default=dict` so ORM-created instances
    # get a fresh empty dict; the migration uses server_default='{}' so raw
    # SQL inserts without an explicit value also get a valid JSON object.
    data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
