"use client";

/**
 * EnergyProfileStep — 온보딩 3단계 냉난방·전기요금 (명세서 §10.5)
 *
 * 조건부 UI:
 * - 에어컨 '없음' → 소비전력/설정 온도/사용 시간 숨김
 * - 에어컨 있고 소비전력 미입력 → 방 평수 권장 안내
 * - 소비전력·방 평수 모두 없음 → 기본 추정값 안내
 */
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import {
  ControlledChipGroup,
  ControlledNumberField,
  ControlledTemperatureSlider,
  ControlledToggle,
  ControlledUsageHourSlider,
} from "./ControlledFields";
import { FormHelperText } from "@/components/form/FormHelperText";
import type { ProfileSchemaInput } from "@/schemas/profile.schema";
import {
  AC_TYPES,
  COMFORT_PREFERENCES,
  CURTAIN_TYPES,
  ROOM_SIZES,
} from "@/schemas/profile.schema";

export function EnergyProfileStep({
  control,
}: {
  control: Control<ProfileSchemaInput>;
}) {
  const acType = useWatch({ control, name: "energy_profile.ac_type" });
  const acPower = useWatch({ control, name: "energy_profile.ac_power_watt" });
  const roomSize = useWatch({ control, name: "energy_profile.room_size" });
  const bill = useWatch({
    control,
    name: "energy_profile.monthly_electricity_bill",
  });
  const goal = useWatch({ control, name: "energy_profile.monthly_goal_bill" });

  const acDisabled = acType === "없음";
  const showRoomSizeHint = !acDisabled && acType != null && acPower == null;
  const showEstimateHint = !acDisabled && acPower == null && roomSize == null;
  const showZeroBillHint = bill === 0;
  const showGoalHigherHint =
    typeof bill === "number" && typeof goal === "number" && goal > bill;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <ControlledNumberField
          control={control}
          name="energy_profile.monthly_electricity_bill"
          label="최근 월 전기요금"
          helper="절약액 기준으로 사용돼요"
          unit="원"
          placeholder="예: 50000"
          min={0}
          max={1_000_000}
        />
        {showZeroBillHint ? (
          <FormHelperText variant="warning">
            0원이면 절약액 표시가 제한될 수 있어요.
          </FormHelperText>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <ControlledNumberField
          control={control}
          name="energy_profile.monthly_goal_bill"
          label="월 전기요금 목표 (선택)"
          helper="목표가 있으면 달성률을 보여줘요"
          unit="원"
          placeholder="예: 40000"
          min={0}
          max={1_000_000}
        />
        {showGoalHigherHint ? (
          <FormHelperText variant="warning">
            목표 요금이 현재 요금보다 높아요. 그래도 저장할 수 있어요.
          </FormHelperText>
        ) : null}
      </div>

      <ControlledChipGroup
        control={control}
        name="energy_profile.ac_type"
        label="에어컨 보유 여부"
        helper="냉방 행동 방식을 정해요"
        options={AC_TYPES}
      />

      {acDisabled ? (
        <FormHelperText variant="helper">
          에어컨 없이 실천 가능한 절약 행동을 추천할게요.
        </FormHelperText>
      ) : null}

      <ControlledToggle
        control={control}
        name="energy_profile.has_fan"
        label="선풍기 보유 여부"
        helper="에어컨 보조 행동 추천에 사용돼요"
        onLabel="있음"
        offLabel="없음"
      />

      <ControlledChipGroup
        control={control}
        name="energy_profile.curtain_type"
        label="차광 커튼·블라인드"
        helper="차광 행동 추천에 사용돼요"
        options={CURTAIN_TYPES}
      />

      {/* 에어컨 관련 입력 — '없음'이면 숨김 (명세서 §10.5 조건부 UI) */}
      {!acDisabled ? (
        <>
          <div className="flex flex-col gap-1">
            <ControlledNumberField
              control={control}
              name="energy_profile.ac_power_watt"
              label="에어컨 소비전력 (선택)"
              helper="알면 절약액이 더 정확해져요"
              unit="W"
              placeholder="예: 1800"
              min={100}
              max={5000}
            />
            {showRoomSizeHint ? (
              <FormHelperText variant="warning">
                모르면 방 평수로 대신 추정할 수 있어요.
              </FormHelperText>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <ControlledChipGroup
              control={control}
              name="energy_profile.room_size"
              label="방 평수 (선택)"
              helper="소비전력을 모를 때 추정해요"
              options={ROOM_SIZES}
            />
            {showEstimateHint ? (
              <FormHelperText variant="warning">
                기본 추정값으로 계산될 수 있어요.
              </FormHelperText>
            ) : null}
          </div>

          <ControlledTemperatureSlider
            control={control}
            name="energy_profile.current_temperature_setting"
            label="현재 설정 온도 (선택)"
            helper="기본값 26°C"
          />

          <ControlledUsageHourSlider
            control={control}
            name="energy_profile.daily_ac_usage_hours"
            label="하루 평균 에어컨 사용 시간 (선택)"
            helper="기본값 6시간"
          />
        </>
      ) : null}

      <ControlledNumberField
        control={control}
        name="energy_profile.electricity_unit_price"
        label="전기요금 단가 (선택)"
        helper="모르면 기본값 사용"
        unit="원/kWh"
        placeholder="예: 150"
        min={1}
        max={1000}
      />

      <ControlledChipGroup
        control={control}
        name="energy_profile.comfort_preference"
        label="쾌적 온도 선호도"
        helper="추천 강도를 조절해요"
        options={COMFORT_PREFERENCES}
        variant="card"
      />
    </div>
  );
}
