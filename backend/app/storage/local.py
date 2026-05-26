import uuid
from pathlib import Path

from app.core.config import settings
from app.storage.base import CONTENT_TYPE_EXT, Storage

MEDIA_PREFIX = "/media/"


class LocalStorage(Storage):
    """Stores uploads on the local filesystem, served by FastAPI at /media."""

    def __init__(self) -> None:
        self.dir = Path(settings.UPLOAD_DIR)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.base_url = settings.MEDIA_BASE_URL.rstrip("/")

    def save(self, *, data: bytes, filename: str, content_type: str) -> str:
        ext = Path(filename).suffix.lower() or CONTENT_TYPE_EXT.get(content_type, "")
        key = f"{uuid.uuid4().hex}{ext}"
        (self.dir / key).write_bytes(data)
        return f"{self.base_url}{MEDIA_PREFIX}{key}"

    def delete(self, url: str) -> None:
        if MEDIA_PREFIX not in url:
            return
        key = url.rsplit(MEDIA_PREFIX, 1)[-1]
        path = self.dir / key
        if path.is_file():
            path.unlink()
