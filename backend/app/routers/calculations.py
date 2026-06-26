"""요금 시뮬레이션 라우터: POST /api/v1/calculations/estimate.

현재 설정 vs 목표 설정의 에너지/요금/CO2를 계산해 절약량을 반환한다.
calculation_service의 순수 계산 함수(temperature_coefficient, estimate_ac_power_watt,
calculate_energy_kwh, calculate_saving_krw, calculate_co2_reduction)를 조합한다.

입력은 모두 선택이며 미입력 시 기본 가정값(설정온도 26°C, 사용 8h, 단가 150원/kWh)을 쓴다.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.core.errors import api_meta_from_request
from app.schemas.calculation import (
    CalculationEstimateRequest,
    CalculationEstimateResponse,
    EnergyCostPair,
    SavingResult,
)
from app.schemas.common import ApiSuccessResponse
from app.services import calculation_service as calc

router = APIRouter(prefix="/calculations", tags=["Calculations"])

# 기본 가정값
_DEFAULT_TEMP = 26.0
_DEFAULT_HOURS = 8.0


@router.post(
    "/estimate",
    response_model=ApiSuccessResponse[CalculationEstimateResponse],
    summary="요금 시뮬레이션",
    description="현재/목표 설정온도 기준 에너지·요금·CO2와 절약량을 계산합니다.",
)
def estimate(
    request: Request,
    body: CalculationEstimateRequest,
) -> ApiSuccessResponse[CalculationEstimateResponse]:
    power = calc.estimate_ac_power_watt(body.ac_power_watt, body.room_size)
    hours = body.daily_ac_usage_hours if body.daily_ac_usage_hours is not None else _DEFAULT_HOURS
    unit_price = body.electricity_unit_price or calc.DEFAULT_UNIT_PRICE
    current_temp = (
        body.current_temperature_setting
        if body.current_temperature_setting is not None
        else _DEFAULT_TEMP
    )
    target_temp = (
        body.target_temperature_setting
        if body.target_temperature_setting is not None
        else current_temp
    )

    # 입력 범위 검증 (VALIDATION_ERROR 422)
    calc.validate_calculation_inputs(
        power_watt=power, usage_hours=hours, unit_price=unit_price, temp_setting=current_temp
    )
    calc.validate_calculation_inputs(temp_setting=target_temp)

    coeff_cur = calc.temperature_coefficient(current_temp)
    coeff_tgt = calc.temperature_coefficient(target_temp)

    cur_kwh = calc.calculate_energy_kwh(power, coeff_cur, hours)
    tgt_kwh = calc.calculate_energy_kwh(power, coeff_tgt, hours)
    cur_cost = calc.calculate_saving_krw(cur_kwh, unit_price)
    tgt_cost = calc.calculate_saving_krw(tgt_kwh, unit_price)

    saving_kwh = round(cur_kwh - tgt_kwh, 3)
    saving_krw = cur_cost - tgt_cost
    co2 = calc.calculate_co2_reduction(saving_kwh)

    data = CalculationEstimateResponse(
        current=EnergyCostPair(energy_kwh=cur_kwh, cost_krw=cur_cost),
        target=EnergyCostPair(energy_kwh=tgt_kwh, cost_krw=tgt_cost),
        saving=SavingResult(
            energy_saving_kwh=saving_kwh, saving_krw=saving_krw, co2_reduction_kg=co2
        ),
        assumptions={
            "power_watt": power,
            "usage_hours": hours,
            "unit_price": unit_price,
            "current_temperature_setting": current_temp,
            "target_temperature_setting": target_temp,
        },
    )
    return ApiSuccessResponse(data=data, meta=api_meta_from_request(request))
