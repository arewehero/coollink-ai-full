from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GoogleUserInfo(BaseModel):
    sub: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: bool = False


class UserMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    user_id: uuid.UUID = Field(serialization_alias="user_id")
    name: Optional[str] = None
    email: str
    profile_image: Optional[str] = Field(
        default=None,
        validation_alias="profile_image",
        serialization_alias="profileImage",
    )
    region: Optional[str] = None
    household_size: Optional[int] = Field(default=None, serialization_alias="householdSize")
    residence_type: Optional[str] = Field(default=None, serialization_alias="residenceType")
    main_cooling_device: Optional[str] = Field(default=None, serialization_alias="mainCoolingDevice")
    has_profile: bool = False
    profile_completed: bool = Field(default=False, serialization_alias="profileCompleted")


class UserMeUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    name: Optional[str] = None
    region: Optional[str] = None
    household_size: Optional[int] = Field(default=None, validation_alias="householdSize", ge=1)
    residence_type: Optional[str] = Field(default=None, validation_alias="residenceType")
    main_cooling_device: Optional[str] = Field(default=None, validation_alias="mainCoolingDevice")

    @field_validator("name", "region", "residence_type", "main_cooling_device")
    @classmethod
    def strip_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None
