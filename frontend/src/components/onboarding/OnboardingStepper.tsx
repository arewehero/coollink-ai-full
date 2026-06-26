/**
 * OnboardingStepper — 진행률 표시 (명세서 §10.2, 1/3 · 2/3 · 3/3)
 */
export function OnboardingStepper({
  step,
  total,
}: {
  /** 0-based */
  step: number;
  total: number;
}) {
  const current = step + 1;
  const percent = Math.round((current / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium text-neutral">
        <span>
          {current} / {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
