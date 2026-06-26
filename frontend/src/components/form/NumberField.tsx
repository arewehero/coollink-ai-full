"use client";

/**
 * NumberField — 원/kWh/W/h 숫자 입력 (명세서 §11.2)
 *
 * 빈 값은 null로, 숫자는 number로 emit 한다. 단위는 접미사로 표시한다.
 * 모바일 숫자 키패드를 위해 inputMode="numeric"을 사용한다(명세서 §20.4).
 */
export function NumberField({
  id,
  value,
  onChange,
  unit,
  placeholder,
  min,
  max,
  disabled = false,
  invalid = false,
  describedBy,
}: {
  id?: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <div
      className={`flex items-center rounded-xl border bg-surface px-3.5 ${
        invalid ? "border-danger" : "border-border"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(null);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isNaN(parsed) ? null : parsed);
        }}
        className="w-full bg-transparent py-3 text-sm text-foreground outline-none"
      />
      {unit ? (
        <span className="pl-2 text-sm text-neutral">{unit}</span>
      ) : null}
    </div>
  );
}
