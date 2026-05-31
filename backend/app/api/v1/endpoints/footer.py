"""Storefront footer configuration (singleton GET/PUT).

GET /footer  — public, no auth required.
PUT /footer  — requires the `frontend.manage` permission.
"""
from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.schemas.footer import FooterConfigRead, FooterConfigUpdate, LogoUploadResponse
from app.services.footer_service import FooterService

router = APIRouter()


@router.get("", response_model=FooterConfigRead)
def get_footer(db: Session = Depends(get_db)):
    """Return the current footer configuration.  Public — no authentication
    required so the storefront can fetch it without a token."""
    return FooterService(db).get()


@router.put(
    "",
    response_model=FooterConfigRead,
    dependencies=[Depends(require_permission("frontend.manage"))],
)
def update_footer(payload: FooterConfigUpdate, db: Session = Depends(get_db)):
    """Replace the footer configuration.  Requires `frontend.manage`."""
    return FooterService(db).update(payload)


@router.post(
    "/logo",
    response_model=LogoUploadResponse,
    dependencies=[Depends(require_permission("frontend.manage"))],
)
async def upload_logo(file: UploadFile, db: Session = Depends(get_db)):
    """Upload a brand logo image and return its public URL. The admin UI then
    stores the URL on `brand.logo_url` via the normal PUT. Requires
    `frontend.manage`."""
    file_bytes = await file.read()
    url = FooterService(db).upload_logo(
        file_bytes=file_bytes,
        filename=file.filename or "logo",
        content_type=file.content_type or "",
    )
    return {"url": url}
