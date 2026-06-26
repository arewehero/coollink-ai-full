"use client";

/**
 * TemperatureSlider — 설정 온도 슬라이더 (명세서 §10.5, 18~30°C, 기본 26°C)
 */
const MIN = 18;
const MAX = 30;

export function TemperatureSlider({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id?: string;
  value?: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const current = value ?? 26;

  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral">
          {MIN}°C ~ {MAX}°C
        </span>
        <span className="font-semibold text-foreground">{current}°C</span>
      </div>
      <input
        id={id}
        type="range"
        min={MIN}
        max={MAX}
        step={1}
        value={current}
        disabled={disabled}
        aria-valuetext={`${current}°C`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
