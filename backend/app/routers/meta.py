"""Meta 라우터: 온보딩/설정 선택지(enums)와 계산 기준값(assumptions).

GET /api/v1/meta/enums       — 프로필 입력 Literal 선택지(스키마에서 동적 추출)
GET /api/v1/meta/assumptions — 절약/CO2 계산에 쓰는 기준 상수와 계산식 안내
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Union, get_args, get_origin

from fastapi import APIRouter, Request

from app.core.errors import api_meta_from_request
from app.schemas.common import ApiSuccessResponse
from app.schemas.profile import EnergyProfileSchema, HomeEnvironmentSchema, LifestyleSchema
from app.services import calculation_service as calc

router = APIRouter(prefix="/meta", tags=["Meta"])

_HOME_FIELDS = [
    "housing_type", "direction", "floor_level", "building_age",
    "insulation_level", "window_size", "ventilation_level", "window_sealing",
]
_LIFESTYLE_FIELDS = [
    "main_activity_time", "daytime_home_stay", "sleep_time",
    "outdoor_activity", "hot_time_home_stay",
]
_ENERGY_FIELDS = ["ac_type", "curtain_type", "comfort_preference"]


def _literal_values(model: Any, field: str) -> List[str]:
    """Pydantic 모델 필드의 Literal 값들을 추출(Optional[Literal[...]]도 처리)."""
    annotation = model.model_fields[field].annotation
    if get_origin(annotation) is Union:
        for arg in get_args(annotation):
            if get_origin(arg) is Literal:
                return list(get_args(arg))
        return []
    if get_origin(annotation) is Literal:
        return list(get_args(annotation))
    return []


@router.get("/enums", summary="온보딩/설정 선택지")
def get_enums(request: Request) -> ApiSuccessResponse[Dict[str, Any]]:
    data: Dict[str, Any] = {}
    for field in _HOME_FIELDS:
        data[field] = _literal_values(HomeEnvironmentSchema, field)
    for field in _LIFESTYLE_FIELDS:
        data[field] = _literal_values(LifestyleSchema, field)
    for field in _ENERGY_FIELDS:
        data[field] = _literal_values(EnergyProfileSchema, field)
    # room_size는 입력 스키마에 없으므로 계산 엔진의 평형 매핑 키를 사용
    data["room_size"] = list(calc._ROOM_SIZE_POWER_MAP.keys())
    data["difficulty"] = ["쉬움", "보통", "어려움"]
    return ApiSuccessResponse(data=data, meta=api_meta_from_request(request))


@router.get("/assumptions", summary="계산 기준값")
def get_assumptions(request: Request) -> ApiSuccessResponse[Dict[str, Any]]:
    data: Dict[str, Any] = {
        "co2_factor_kg_per_kwh": calc.CO2_EMISSION_FACTOR,
        "electricity_unit_price_krw_per_kwh": calc.DEFAULT_UNIT_PRICE,
        "default_ac_power_watt": calc.DEFAULT_AC_POWER_WATT,
        "room_size_power_watt": dict(calc._ROOM_SIZE_POWER_MAP),
        "temperature_coefficient": {
            "26°C 이상": 0.92,
            "25°C": 1.00,
            "24°C": 1.08,
            "23°C 이하": 1.17,
        },
        "notes": [
            "전력량(kWh) = 소비전력(W) × 온도계수 × 사용시간(h) ÷ 1000",
            "절약액(원) = 절약 전력량(kWh) × 전기요금 단가(원/kWh)",
            "CO₂ 감축량(kg) = 절약 전력량(kWh) × 0.4781",
            "소비전력을 입력하지 않으면 평형 기준 추정값(없으면 1200W)을 사용합니다.",
            "전기요금 단가를 입력하지 않으면 150원/kWh를 적용합니다.",
            "설정온도 미입력 시 26°C를 기준으로 계산합니다.",
        ],
    }
    return ApiSuccessResponse(data=data, meta=api_meta_from_request(request))
