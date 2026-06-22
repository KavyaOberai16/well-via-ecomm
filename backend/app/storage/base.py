from abc import ABC, abstractmethod

# Extensions allowed for uploaded images, mapped from content type.
CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
}


class Storage(ABC):
    """A pluggable image store. Implementations return a public URL on save."""

    @abstractmethod
    def save(self, *, data: bytes, filename: str, content_type: str) -> str:
        """Persist file bytes and return a publicly reachable URL."""

    @abstractmethod
    def delete(self, url: str) -> None:
        """Remove a previously saved file. Missing files are ignored."""
