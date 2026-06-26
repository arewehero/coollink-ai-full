"use client";

/**
 * CalculationSimulatorForm — 온도/시간 입력 (명세서 §10.14, §11.4)
 */
import { ChipGroup } from "@/components/form/ChipGroup";
import { NumberField } from "@/components/form/NumberField";
import { TemperatureSlider } from "@/components/form/TemperatureSlider";
import { UsageHourSlider } from "@/components/form/UsageHourSlider";
import { ROOM_SIZES } from "@/schemas/profile.schema";
import type { SimInput } from "@/features/simulator/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </div>
  );
}

export function CalculationSimulatorForm({
  value,
  onChange,
}: {
  value: SimInput;
  onChange: (patch: Partial<SimInput>) => void;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
      <Field label="현재 설정 온도">
        <TemperatureSlider
          value={value.current_temperature_setting}
          onChange={(v) => onChange({ current_temperature_setting: v })}
        />
      </Field>

      <Field label="목표 설정 온도">
        <TemperatureSlider
          value={value.target_temperature_setting}
          onChange={(v) => onChange({ target_temperature_setting: v })}
        />
      </Field>

      <Field label="하루 평균 사용 시간">
        <UsageHourSlider
          value={value.daily_ac_usage_hours}
          onChange={(v) => onChange({ daily_ac_usage_hours: v })}
        />
      </Field>

      <Field label="에어컨 소비전력">
        <NumberField
          value={value.ac_power_watt}
          onChange={(v) => onChange({ ac_power_watt: v })}
          unit="W"
          placeholder="예: 1800"
          min={100}
          max={5000}
        />
      </Field>

      <Field label="전기요금 단가">
        <NumberField
          value={value.electricity_unit_price}
          onChange={(v) => onChange({ electricity_unit_price: v })}
          unit="원/kWh"
          placeholder="예: 150"
          min={1}
          max={1000}
        />
      </Field>

      <Field label="방 평수 (선택)">
        <ChipGroup
          options={ROOM_SIZES}
          value={value.room_size}
          onChange={(v) => onChange({ room_size: v as SimInput["room_size"] })}
          ariaLabel="방 평수"
        />
      </Field>
    </div>
  );
}
