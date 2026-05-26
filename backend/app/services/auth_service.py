import secrets

import redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.email import send_email
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.common import Token
from app.schemas.user import UserCreate


def _otp_key(email: str) -> str:
    return f"otp:reset:{email.lower()}"


class AuthService:
    def __init__(self, db: Session, redis_client: redis.Redis | None = None):
        self.db = db
        self.users = UserRepository(db)
        self.redis = redis_client or redis.Redis.from_url(
            settings.REDIS_URL, decode_responses=True
        )

    def register(self, data: UserCreate) -> User:
        if self.users.get_by_email(data.email):
            raise ConflictError("Email already registered")
        user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )
        self.users.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, email: str, password: str) -> Token:
        user = self.users.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid credentials")
        if not user.is_active:
            raise UnauthorizedError("Account disabled")
        return self._issue_tokens(user)

    def _issue_tokens(self, user: User) -> Token:
        return Token(
            access_token=create_access_token(user.id, {"admin": user.is_admin}),
            refresh_token=create_refresh_token(user.id),
        )

    # ---- Password reset (OTP over email) ----

    def request_password_reset(self, email: str) -> None:
        """Generate and email a one-time code. Silent if the email is unknown
        — the caller must not reveal whether an account exists."""
        user = self.users.get_by_email(email)
        if not user:
            return
        otp = f"{secrets.randbelow(1_000_000):06d}"
        self.redis.setex(_otp_key(email), settings.OTP_TTL_MINUTES * 60, otp)
        send_email(
            to=email,
            subject="Your password reset code",
            body=(
                f"Your one-time password reset code is: {otp}\n\n"
                f"It expires in {settings.OTP_TTL_MINUTES} minutes. "
                "If you didn't request this, you can ignore this email."
            ),
        )

    def reset_password(self, email: str, otp: str, new_password: str) -> None:
        stored = self.redis.get(_otp_key(email))
        if not stored or stored != otp:
            raise UnauthorizedError("Invalid or expired code")
        user = self.users.get_by_email(email)
        if not user:
            raise UnauthorizedError("Invalid or expired code")
        user.hashed_password = hash_password(new_password)
        self.db.commit()
        self.redis.delete(_otp_key(email))

    # ---- Google sign-in ----

    def login_with_google(self, email: str, full_name: str | None) -> Token:
        """Find or create a user for a verified Google profile, then issue tokens."""
        user = self.users.get_by_email(email)
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                # No usable password — a Google user signs in via Google
                # (or sets a password later through the reset flow).
                hashed_password=hash_password(secrets.token_urlsafe(32)),
                is_active=True,
            )
            self.users.add(user)
            self.db.commit()
            self.db.refresh(user)
        elif not user.is_active:
            raise UnauthorizedError("Account disabled")
        return self._issue_tokens(user)
