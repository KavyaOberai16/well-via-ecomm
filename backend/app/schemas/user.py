from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_admin: bool
    roles: list[RoleBrief] = []
    # Flat list of permission names. Populated from User.permissions_list so the
    # frontend can mirror server-side checks without an extra round-trip.
    permissions: list[str] = []
    created_at: datetime
