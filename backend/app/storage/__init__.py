from functools import lru_cache

from app.core.config import settings
from app.storage.base import Storage
from app.storage.local import LocalStorage


@lru_cache
def get_storage() -> Storage:
    """Return the configured storage backend (cached for the process)."""
    if settings.STORAGE_BACKEND == "s3":
        from app.storage.s3 import S3Storage  # imported lazily — boto3 only when needed

        return S3Storage()
    return LocalStorage()
