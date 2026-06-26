"use client";

/**
 * HomeEnvironmentStep — 온보딩 1단계 집 환경 (명세서 §10.3)
 */
import type { Control } from "react-hook-form";
import { ControlledChipGroup } from "./ControlledFields";
import type { ProfileSchemaInput } from "@/schemas/profile.schema";
import {
  BUILDING_AGES,
  DIRECTIONS,
  FLOOR_LEVELS,
  HOUSING_TYPES,
  INSULATION_LEVELS,
  VENTILATION_LEVELS,
  WINDOW_SEALINGS,
  WINDOW_SIZES,
} from "@/schemas/profile.schema";

export function HomeEnvironmentStep({
  control,
}: {
  control: Control<ProfileSchemaInput>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ControlledChipGroup
        control={control}
        name="home_environment.housing_type"
        label="주택 형태"
        helper="공간 규모와 냉방 효율을 추정해요"
        options={HOUSING_TYPES}
      />
      <ControlledChipGroup
        control={control}
        name="home_environment.direction"
        label="방향"
        helper="오후 햇빛 영향을 판단해요"
        options={DIRECTIONS}
        variant="compass"
      />
      <ControlledChipGroup
        control={control}
        name="home_environment.floor_level"
        label="층 위치"
        helper="열이 쌓이기 쉬운지를 봐요"
        options={FLOOR_LEVELS}
      />
      <ControlledChipGroup
        control={control}
        name="home_environment.building_age"
        label="건물 노후도"
        helper="단열 성능 추정에 사용돼요"
        options={BUILDING_AGES}
      />
      <ControlledChipGroup
        control={control}
        name="home_environment.insulation_level"
        label="단열 수준"
        helper="냉기가 새는 정도를 판단해요"
        options={INSULATION_LEVELS}
      />
      <ControlledChipGroup
        control={control}
        name="home_environment.window_size"
        label="창문 크기"
        helper="햇빛 유입과 환기 효과를 봐요"
        options={WINDOW_SIZES}
      />
      <ControlledChipGroup
        control={control}
        name="home_environment.ventilation_level"
        label="환기 가능성"
        helper="아침·야간 환기 추천에 사용돼요"
        options={VENTILATION_LEVELS}
      />
      <ControlledChipGroup
        control={control}
        name="home_environment.window_sealing"
        label="창호 밀폐성"
        helper="냉방 손실 가능성을 판단해요"
        options={WINDOW_SEALINGS}
      />
    </div>
  );
}
