"""Calculation Engine for energy, saving, and CO₂ computations.

Provides pure functions for:
- Energy consumption (kWh)
- Saving amount (KRW)
- CO₂ reduction (kg)
- Temperature coefficient mapping
- AC power estimation by room size
- Input validation

All formulas follow the design specification:
- kWh = power_W × temp_coeff × hours ÷ 1000 (rounded to 3 decimals)
- KRW = kWh × unit_price (rounded to integer)
- CO₂_kg = kWh × 0.4781 (rounded to 4 decimals)
"""

from __future__ import annotations

from typing import Optional

from app.core.errors import ApiException, ErrorCode

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CO2_EMISSION_FACTOR: float = 0.4781  # kg CO₂ per kWh
DEFAULT_UNIT_PRICE: int = 150  # 원/kWh
DEFAULT_AC_POWER_WATT: int = 1200  # W

# ---------------------------------------------------------------------------
# Realistic saving bounds (anchored to the user's actual monthly bill)
# ---------------------------------------------------------------------------
# 절감액이 사용자의 실제 전기요금을 초과하는 비현실적 값을 막기 위한 상한 가정.
#
# 핵심 아이디어: 행동 변화로 줄일 수 있는 금액은 "냉방이 요금에서 차지하는 비중"과
# "그 냉방요금 중 행동으로 줄일 수 있는 비율"의 곱으로 제한된다. 즉, 한 달 동안
# 추천 행동을 모두 실천해도 절감액은 청구액의 일부(기본 약 13.5%)를 넘을 수 없다.
DAYS_PER_MONTH: int = 30  # 월 환산 시 사용하는 표준 일수
# 여름철 냉방(에어컨 등)이 가정 전기요금에서 차지하는 평균 비중 가정값
COOLING_BILL_SHARE: float = 0.45
# 설정온도 상향·가동시간 단축·차광 등 '행동 변화'만으로 줄일 수 있는
# 냉방요금의 최대 비율 가정값 (설비 교체 제외)
MAX_COOLING_REDUCTION_RATE: float = 0.30

# Temperature coefficient mapping (design spec)
_TEMP_COEFFICIENTS: dict[str, float] = {
    "high": 0.92,   # 26°C 이상
    "normal": 1.00,  # 25°C
    "low": 1.08,    # 24°C
    "very_low": 1.17,  # 23°C 이하
}

# Room size to AC power watt mapping
_ROOM_SIZE_POWER_MAP: dict[str, int] = {
    "~6평": 750,
    "7~10평": 1200,
    "11~14평": 1800,
    "15평~": 2200,
}


# ---------------------------------------------------------------------------
# Input Validation
# ---------------------------------------------------------------------------


def validate_calculation_inputs(
    *,
    power_watt: Optional[int] = None,
    usage_hours: Optional[float] = None,
    unit_price: Optional[int] = None,
    temp_setting: Optional[float] = None,
) -> None:
    """Validate calculation input ranges.

    Raises ApiException (VALIDATION_ERROR, 422) if any provided value
    is outside its valid range.

    Valid ranges:
    - power_watt: 1 ~ 5000 (W)
    - usage_hours: 0 ~ 24 (h)
    - unit_price: 1 ~ 1000 (원/kWh)
    - temp_setting: 18 ~ 30 (°C)

    Only validates parameters that are not None.
    """
    errors: dict[str, str] = {}

    if power_watt is not None and not (1 <= power_watt <= 5000):
        errors["power_watt"] = "소비전력은 1~5000W 범위여야 합니다."

    if usage_hours is not None and not (0 <= usage_hours <= 24):
        errors["usage_hours"] = "사용시간은 0~24h 범위여야 합니다."

    if unit_price is not None and not (1 <= unit_price <= 1000):
        errors["unit_price"] = "전기요금 단가는 1~1000원/kWh 범위여야 합니다."

    if temp_setting is not None and not (18 <= temp_setting <= 30):
        errors["temp_setting"] = "설정 온도는 18~30°C 범위여야 합니다."

    if errors:
        raise ApiException.from_error_code(
            ErrorCode.VALIDATION_ERROR,
            message="계산 입력값이 유효 범위를 벗어났습니다.",
            details=errors,
        )


# ---------------------------------------------------------------------------
# Temperature Coefficient
# ---------------------------------------------------------------------------


def temperature_coefficient(temp_setting: float) -> float:
    """Return temperature coefficient based on the AC setting temperature.

    Mapping:
    - 26°C 이상: 0.92 (에너지 절약)
    - 25°C (25 <= T < 26): 1.00 (기준)
    - 24°C (24 <= T < 25): 1.08
    - 23°C 이하 (T < 24): 1.17 (에너지 증가)
    """
    if temp_setting is None:
        temp_setting = 26.0  # 기본 설정온도(명세 §5.3): current_temperature_setting 미입력 시
    if temp_setting >= 26:
        return 0.92
    elif temp_setting >= 25:
        return 1.00
    elif temp_setting >= 24:
        return 1.08
    else:
        return 1.17


# ---------------------------------------------------------------------------
# Power Estimation
# ---------------------------------------------------------------------------


def estimate_ac_power_watt(
    ac_power_watt: Optional[int] = None,
    room_size: Optional[str] = None,
) -> int:
    """Estimate AC power consumption in watts.

    Priority:
    1. If ac_power_watt is provided (> 0), use it directly.
    2. If room_size is provided and in the lookup table, use the mapped value.
    3. Otherwise, return the default 1200W.
    """
    if ac_power_watt is not None and ac_power_watt > 0:
        return ac_power_watt

    if room_size is not None and room_size in _ROOM_SIZE_POWER_MAP:
        return _ROOM_SIZE_POWER_MAP[room_size]

    return DEFAULT_AC_POWER_WATT


# ---------------------------------------------------------------------------
# Core Calculation Functions
# ---------------------------------------------------------------------------


def calculate_energy_kwh(power_watt: int, temp_coeff: float, usage_hours: float) -> float:
    """Calculate energy consumption in kWh.

    Formula: kWh = power_W × temp_coeff × hours ÷ 1000
    Result is rounded to 3 decimal places.
    """
    return round((power_watt * temp_coeff * usage_hours) / 1000, 3)


def calculate_saving_krw(energy_saving_kwh: float, unit_price: int = DEFAULT_UNIT_PRICE) -> int:
    """Calculate monetary saving in KRW.

    Formula: KRW = energy_saving_kwh × unit_price
    Result is rounded to the nearest integer.
    Default unit_price: 150 KRW/kWh.
    """
    return round(energy_saving_kwh * unit_price)


def calculate_co2_reduction(energy_saving_kwh: float) -> float:
    """Calculate CO₂ reduction in kg.

    Formula: CO₂_kg = energy_saving_kwh × 0.4781
    Result is rounded to 4 decimal places.
    """
    return round(energy_saving_kwh * CO2_EMISSION_FACTOR, 4)


# ---------------------------------------------------------------------------
# Bill-anchored realistic saving bounds
# ---------------------------------------------------------------------------


def estimate_daily_bill_krw(
    monthly_bill_krw: Optional[int], *, days_in_month: int = DAYS_PER_MONTH
) -> float:
    """월 청구액으로부터 하루 평균 전기요금(원)을 추정한다.

    값이 없거나 0 이하이면 0.0을 반환한다.
    """
    if not monthly_bill_krw or monthly_bill_krw <= 0 or days_in_month <= 0:
        return 0.0
    return monthly_bill_krw / days_in_month


def realistic_monthly_saving_ceiling_krw(
    monthly_bill_krw: Optional[int],
    *,
    cooling_share: float = COOLING_BILL_SHARE,
    reduction_rate: float = MAX_COOLING_REDUCTION_RATE,
) -> int:
    """행동 변화만으로 한 달에 현실적으로 줄일 수 있는 절감액 상한(원).

    상한 = 월 청구액 × 냉방 비중 × 냉방 절감률.
    어떤 경우에도 월 청구액 자체를 넘지 않는다(요금보다 더 아낄 수는 없음).
    """
    if not monthly_bill_krw or monthly_bill_krw <= 0:
        return 0
    ceiling = monthly_bill_krw * cooling_share * reduction_rate
    return int(round(min(ceiling, monthly_bill_krw)))


def max_daily_behavioral_saving_krw(
    monthly_bill_krw: Optional[int],
    *,
    days_in_month: int = DAYS_PER_MONTH,
    cooling_share: float = COOLING_BILL_SHARE,
    reduction_rate: float = MAX_COOLING_REDUCTION_RATE,
) -> float:
    """하루에 행동 변화로 현실적으로 줄일 수 있는 절감액 상한(원).

    월간 상한을 일수로 나눈 값. 청구액이 없으면 0.0을 반환한다.
    스케일링 계수 계산에 쓰므로 정수 반올림 없이 float로 돌려준다.
    """
    daily_bill = estimate_daily_bill_krw(monthly_bill_krw, days_in_month=days_in_month)
    if daily_bill <= 0:
        return 0.0
    return daily_bill * cooling_share * reduction_rate


def cap_monthly_saving_krw(
    projected_krw: int,
    monthly_bill_krw: Optional[int],
    *,
    cooling_share: float = COOLING_BILL_SHARE,
    reduction_rate: float = MAX_COOLING_REDUCTION_RATE,
) -> int:
    """월 절감 예측치를 현실적인 범위로 제한한다.

    - 청구액 정보가 없으면 음수만 0으로 보정해 그대로 반환한다.
    - 청구액이 있으면 (1) 현실적 냉방 절감 상한, (2) 청구액 자체를 넘지 않도록 캡한다.
    """
    projected = max(0, projected_krw)
    if not monthly_bill_krw or monthly_bill_krw <= 0:
        return projected
    ceiling = realistic_monthly_saving_ceiling_krw(
        monthly_bill_krw, cooling_share=cooling_share, reduction_rate=reduction_rate
    )
    return min(projected, ceiling)
