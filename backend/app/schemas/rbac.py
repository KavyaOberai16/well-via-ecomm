from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    group_name: str | None


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    description: str | None = None
    permission_ids: list[int] = Field(default_factory=list)


class RoleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    description: str | None = None
    permission_ids: list[int] | None = None


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    is_system: bool
    permissions: list[PermissionRead]
    created_at: datetime
    updated_at: datetime


class UserRolesUpdate(BaseModel):
    role_ids: list[int]
