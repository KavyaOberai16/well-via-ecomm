"""Runtime settings + test-send endpoints. Permission: settings.manage."""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.core.exceptions import AppError
from app.core.rate_limit import get_client_ip
from app.email import send_email
from app.models.user import User
from app.schemas.settings import (
    SettingItem,
    SettingsListResponse,
    SettingsUpdateRequest,
    TestEmailRequest,
    TestSmsRequest,
)
from app.services.audit_service import AuditService
from app.services.settings_service import SettingsService

router = APIRouter()

_SECRET_KEYS_FOR_AUDIT_LOG = {"smtp.password", "twilio.auth_token"}


@router.get(
    "",
    response_model=SettingsListResponse,
    dependencies=[Depends(require_permission("settings.manage"))],
)
def list_settings(db: Session = Depends(get_db)):
    svc = SettingsService(db)
    rows = svc.list_all()
    return SettingsListResponse(
        items=[
            SettingItem(
                key=r.key,
                value=svc.view_value(r),
                category=r.category,
                description=r.description,
                is_secret=r.is_secret,
            )
            for r in rows
        ]
    )


@router.patch(
    "",
    response_model=SettingsListResponse,
)
def update_settings(
    payload: SettingsUpdateRequest,
    request: Request,
    actor: User = Depends(require_permission("settings.manage")),
    db: Session = Depends(get_db),
):
    svc = SettingsService(db)
    changed = svc.set_many(payload.updates, actor=actor)
    if changed:
        audit = AuditService(db)
        ip = get_client_ip(request)
        for row, before, after in changed:
            # Don't log secret values in the audit trail — record only that
            # they changed, never the cleartext.
            redact = row.is_secret or row.key in _SECRET_KEYS_FOR_AUDIT_LOG
            audit.record(
                actor=actor,
                actor_ip=ip,
                action="settings.update",
                target_type="setting",
                target_id=row.id,
                target_label=row.key,
                summary=f"Updated setting {row.key}",
                extra={
                    "before": "***" if redact else before,
                    "after": "***" if redact else after,
                },
            )
    db.commit()
    rows = svc.list_all()
    return SettingsListResponse(
        items=[
            SettingItem(
                key=r.key,
                value=svc.view_value(r),
                category=r.category,
                description=r.description,
                is_secret=r.is_secret,
            )
            for r in rows
        ]
    )


@router.post(
    "/test-email",
    status_code=status.HTTP_200_OK,
)
def send_test_email(
    payload: TestEmailRequest,
    actor: User = Depends(require_permission("settings.manage")),
    db: Session = Depends(get_db),
):
    try:
        send_email(
            to=payload.to,
            subject="Lumen — test email",
            body=(
                "If you're reading this, your SMTP settings are working.\n\n"
                f"Sent by: {actor.email}\n"
            ),
            db=db,
        )
    except Exception as exc:  # surface delivery errors to the admin
        raise AppError(f"Send failed: {exc}") from exc
    return {"detail": f"Test email sent to {payload.to}."}


@router.post(
    "/test-sms",
    status_code=status.HTTP_200_OK,
)
def send_test_sms(
    payload: TestSmsRequest,
    actor: User = Depends(require_permission("settings.manage")),
    db: Session = Depends(get_db),
):
    from app.sms import send_sms
    from app.sms.twilio import SmsConfigError

    try:
        send_sms(to=payload.to, body=payload.body, db=db)
    except SmsConfigError as exc:
        raise AppError(str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise AppError(f"SMS send failed: {exc}") from exc
    return {"detail": f"Test SMS sent to {payload.to}."}
