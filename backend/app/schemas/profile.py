from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class HomeEnvironmentSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    housing_type: str
    direction: str
    floor_level: str
    building_age: str
    insulation_level: str
    window_size: str
    ventilation_level: str
    window_sealing: str


class LifestyleSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    main_activity_time: str
    daytime_home_stay: str
    sleep_time: str
    outdoor_activity: str
    hot_time_home_stay: str


class EnergyProfileSchema(BaseModel):
    # 숫자는 int/float 모두 허용하도록 float 사용(프론트 z.number()와 호환).
    model_config = ConfigDict(extra="ignore")

    monthly_electricity_bill: float
    monthly_goal_bill: Optional[float] = None
    comfort_preference: str
    ac_type: str
    has_fan: bool
    curtain_type: str
    ac_power_watt: Optional[float] = None
    room_size: Optional[str] = None
    current_temperature_setting: Optional[float] = None
    daily_ac_usage_hours: Optional[float] = None
    electricity_unit_price: Optional[float] = None


class ProfilePayloadSchema(BaseModel):
    """PUT /profile 요청 / GET /profile 응답 (프론트 ProfilePayload와 동일 구조)."""

    model_config = ConfigDict(extra="ignore")

    home_environment: HomeEnvironmentSchema
    lifestyle: LifestyleSchema
    energy_profile: EnergyProfileSchema
