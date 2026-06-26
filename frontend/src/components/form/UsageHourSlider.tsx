"use client";

/**
 * UsageHourSlider — 하루 평균 에어컨 사용 시간 (명세서 §10.5, 0~24h, 기본 6h)
 */
const MIN = 0;
const MAX = 24;

export function UsageHourSlider({
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
  const current = value ?? 6;

  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral">
          {MIN}시간 ~ {MAX}시간
        </span>
        <span className="font-semibold text-foreground">{current}시간</span>
      </div>
      <input
        id={id}
        type="range"
        min={MIN}
        max={MAX}
        step={1}
        value={current}
        disabled={disabled}
        aria-valuetext={`${current}시간`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
