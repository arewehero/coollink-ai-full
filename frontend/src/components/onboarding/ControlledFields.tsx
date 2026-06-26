"use client";

/**
 * RHF Controller 래퍼 — 온보딩 폼 필드 글루 (명세서 §10.3~§10.5)
 *
 * 프레젠테이션 컴포넌트(components/form/*)를 react-hook-form Controller에 연결하고,
 * 라벨 / 헬퍼 / 오류 문구를 일관되게 렌더한다.
 */
import { Controller } from "react-hook-form";
import type { Control, FieldPath } from "react-hook-form";
import { ChipGroup, type ChipVariant } from "@/components/form/ChipGroup";
import { NumberField } from "@/components/form/NumberField";
import { ToggleField } from "@/components/form/ToggleField";
import { TemperatureSlider } from "@/components/form/TemperatureSlider";
import { UsageHourSlider } from "@/components/form/UsageHourSlider";
import { FormHelperText } from "@/components/form/FormHelperText";
import type { ProfileSchemaInput } from "@/schemas/profile.schema";

type FieldName = FieldPath<ProfileSchemaInput>;

function FieldShell({
  label,
  helper,
  error,
  htmlFor,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      ) : (
        <span className="text-sm font-semibold text-foreground">{label}</span>
      )}
      {children}
      {error ? (
        <FormHelperText variant="error">{error}</FormHelperText>
      ) : helper ? (
        <FormHelperText>{helper}</FormHelperText>
      ) : null}
    </div>
  );
}

export function ControlledChipGroup({
  control,
  name,
  label,
  helper,
  options,
  variant,
}: {
  control: Control<ProfileSchemaInput>;
  name: FieldName;
  label: string;
  helper?: string;
  options: readonly string[];
  variant?: ChipVariant;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell label={label} helper={helper} error={fieldState.error?.message}>
          <ChipGroup
            options={options}
            value={(field.value ?? null) as string | null}
            onChange={field.onChange}
            variant={variant}
            ariaLabel={label}
            invalid={!!fieldState.error}
          />
        </FieldShell>
      )}
    />
  );
}

export function ControlledNumberField({
  control,
  name,
  label,
  helper,
  unit,
  placeholder,
  min,
  max,
  disabled,
}: {
  control: Control<ProfileSchemaInput>;
  name: FieldName;
  label: string;
  helper?: string;
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const id = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          helper={helper}
          error={fieldState.error?.message}
          htmlFor={id}
        >
          <NumberField
            id={id}
            value={(field.value ?? null) as number | null}
            onChange={field.onChange}
            unit={unit}
            placeholder={placeholder}
            min={min}
            max={max}
            disabled={disabled}
            invalid={!!fieldState.error}
          />
        </FieldShell>
      )}
    />
  );
}

export function ControlledToggle({
  control,
  name,
  label,
  helper,
  onLabel,
  offLabel,
}: {
  control: Control<ProfileSchemaInput>;
  name: FieldName;
  label: string;
  helper?: string;
  onLabel?: string;
  offLabel?: string;
}) {
  const id = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          helper={helper}
          error={fieldState.error?.message}
          htmlFor={id}
        >
          <ToggleField
            id={id}
            value={!!field.value}
            onChange={field.onChange}
            onLabel={onLabel}
            offLabel={offLabel}
          />
        </FieldShell>
      )}
    />
  );
}

export function ControlledTemperatureSlider({
  control,
  name,
  label,
  helper,
  disabled,
}: {
  control: Control<ProfileSchemaInput>;
  name: FieldName;
  label: string;
  helper?: string;
  disabled?: boolean;
}) {
  const id = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldShell label={label} helper={helper} htmlFor={id}>
          <TemperatureSlider
            id={id}
            value={(field.value ?? null) as number | null}
            onChange={field.onChange}
            disabled={disabled}
          />
        </FieldShell>
      )}
    />
  );
}

export function ControlledUsageHourSlider({
  control,
  name,
  label,
  helper,
  disabled,
}: {
  control: Control<ProfileSchemaInput>;
  name: FieldName;
  label: string;
  helper?: string;
  disabled?: boolean;
}) {
  const id = `field-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldShell label={label} helper={helper} htmlFor={id}>
          <UsageHourSlider
            id={id}
            value={(field.value ?? null) as number | null}
            onChange={field.onChange}
            disabled={disabled}
          />
        </FieldShell>
      )}
    />
  );
}
