"use client";

/**
 * LifestyleStep — 온보딩 2단계 생활패턴 (명세서 §10.4)
 */
import type { Control } from "react-hook-form";
import { ControlledChipGroup } from "./ControlledFields";
import { FormHelperText } from "@/components/form/FormHelperText";
import type { ProfileSchemaInput } from "@/schemas/profile.schema";
import {
  DAYTIME_HOME_STAYS,
  HOT_TIME_HOME_STAYS,
  MAIN_ACTIVITY_TIMES,
  OUTDOOR_ACTIVITIES,
  SLEEP_TIMES,
} from "@/schemas/profile.schema";

export function LifestyleStep({
  control,
}: {
  control: Control<ProfileSchemaInput>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* 명세서 §10.4 중요 안내 문구 */}
      <div className="rounded-xl bg-primary-soft px-4 py-3">
        <FormHelperText>
          선택한 생활패턴을 그대로 확정하지 않고, AI가 집 체류 시간과 취침
          시간까지 조합해 실제 유형을 다시 판단해요.
        </FormHelperText>
      </div>

      <ControlledChipGroup
        control={control}
        name="lifestyle.main_activity_time"
        label="주 생활 시간대"
        helper="선택값은 AI 판단의 참고값이에요"
        options={MAIN_ACTIVITY_TIMES}
        variant="card"
      />
      <ControlledChipGroup
        control={control}
        name="lifestyle.daytime_home_stay"
        label="낮 시간 집 체류"
        helper="낮 냉방 필요도를 판단해요"
        options={DAYTIME_HOME_STAYS}
      />
      <ControlledChipGroup
        control={control}
        name="lifestyle.sleep_time"
        label="취침 시간대"
        helper="야간 타이머 추천에 사용돼요"
        options={SLEEP_TIMES}
      />
      <ControlledChipGroup
        control={control}
        name="lifestyle.outdoor_activity"
        label="야외활동 빈도"
        helper="외출 전후 절약 행동을 추천해요"
        options={OUTDOOR_ACTIVITIES}
      />
      <ControlledChipGroup
        control={control}
        name="lifestyle.hot_time_home_stay"
        label="더운 시간대 집 체류"
        helper="한낮 냉방 관리 필요도를 봐요"
        options={HOT_TIME_HOME_STAYS}
      />
    </div>
  );
}
