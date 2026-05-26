import secrets

import httpx
from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.integrations import google
from app.models.user import User
from app.schemas.common import Token
from app.schemas.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return AuthService(db).register(payload)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return AuthService(db).login(payload.email, payload.password)


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/config")
def auth_config():
    """Public capability flags the frontend uses to render auth options."""
    return {"google_login": google.is_configured()}


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always the same response — never reveals whether the email exists.
    AuthService(db).request_password_reset(payload.email)
    return {"detail": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    AuthService(db).reset_password(payload.email, payload.otp, payload.new_password)
    return {"detail": "Your password has been reset. You can now sign in."}


# ---- Google OAuth (server-side redirect flow) ----


@router.get("/google/login")
def google_login():
    frontend_cb = f"{settings.FRONTEND_URL}/auth/callback"
    if not google.is_configured():
        return RedirectResponse(f"{frontend_cb}#error=google_disabled")
    state = secrets.token_urlsafe(24)
    response = RedirectResponse(google.build_auth_url(state))
    response.set_cookie(
        "g_oauth_state", state, max_age=600, httponly=True, samesite="lax"
    )
    return response


@router.get("/google/callback")
def google_callback(
    request: Request,
    db: Session = Depends(get_db),
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    frontend_cb = f"{settings.FRONTEND_URL}/auth/callback"
    if error or not code or not state:
        return RedirectResponse(f"{frontend_cb}#error=google")

    cookie_state = request.cookies.get("g_oauth_state")
    if not cookie_state or cookie_state != state:
        return RedirectResponse(f"{frontend_cb}#error=state")

    try:
        access_token = google.exchange_code(code)
        info = google.fetch_userinfo(access_token)
    except (httpx.HTTPError, KeyError):
        return RedirectResponse(f"{frontend_cb}#error=google")

    email = info.get("email")
    if not email:
        return RedirectResponse(f"{frontend_cb}#error=google")

    try:
        tokens = AuthService(db).login_with_google(email, info.get("name"))
    except UnauthorizedError:
        return RedirectResponse(f"{frontend_cb}#error=disabled")

    response = RedirectResponse(
        f"{frontend_cb}#access_token={tokens.access_token}"
        f"&refresh_token={tokens.refresh_token}"
    )
    response.delete_cookie("g_oauth_state")
    return response
