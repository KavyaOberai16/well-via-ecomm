"""Request/response shapes for the COD OTP endpoints."""
from __future__ import annotations

from pydantic import BaseModel, Field


class CodOtpSendRequest(BaseModel):
    phone: str = Field(min_length=8, max_length=20)


class CodOtpSendResponse(BaseModel):
    phone_masked: str
    expires_in_seconds: int


class CodOtpVerifyRequest(BaseModel):
    phone: str = Field(min_length=8, max_length=20)
    code: str = Field(min_length=4, max_length=8)


class CodOtpVerifyResponse(BaseModel):
    verified: bool = True
