"""요금 시뮬레이션 계산 입출력 스키마.

POST /api/v1/calculations/estimate 의 요청/응답.
현재 설정 vs 목표 설정의 에너지(kWh)/요금(원)/CO2(kg)를 계산한다.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel


class CalculationEstimateRequest(BaseModel):
    """요금 시뮬레이션 요청. 모든 값은 선택이며, 미입력 시 기본 가정값을 사용한다."""

    ac_power_watt: Optional[int] = None
    room_size: Optional[str] = None
    current_temperature_setting: Optional[float] = None
    target_temperature_setting: Optional[float] = None
    daily_ac_usage_hours: Optional[float] = None
    electricity_unit_price: Optional[int] = None


class EnergyCostPair(BaseModel):
    energy_kwh: float
    cost_krw: int


class SavingResult(BaseModel):
    energy_saving_kwh: float
    saving_krw: int
    co2_reduction_kg: float


class CalculationEstimateResponse(BaseModel):
    current: EnergyCostPair
    target: EnergyCostPair
    saving: SavingResult
    assumptions: Dict[str, Any]
