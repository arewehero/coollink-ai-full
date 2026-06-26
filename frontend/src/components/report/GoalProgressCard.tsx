/**
 * GoalProgressCard — 월 목표 달성률 (명세서 §10.13, §11.4)
 */
import type { SavingsSummary } from "@/types/api";
import { formatKrwPlain } from "@/lib/format/money";

export function GoalProgressCard({
  goal,
}: {
  goal: SavingsSummary["goal"];
}) {
  if (!goal) return null;

  const required = goal.required_monthly_saving_krw ?? null;
  const rate =
    required && required > 0
      ? Math.min(100, Math.round((goal.current_projected_saving_krw / required) * 100))
      : null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          월 목표 달성 상태
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            goal.on_track
              ? "bg-primary-soft text-primary"
              : "bg-warning/15 text-warning"
          }`}
        >
          {goal.on_track ? "목표 달성 흐름" : "조금 더 필요해요"}
        </span>
      </div>

      {rate !== null ? (
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={rate}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-neutral">
        현재 월 예상 절약 {formatKrwPlain(goal.current_projected_saving_krw)}
        {required ? ` · 목표까지 약 ${formatKrwPlain(required)} 필요` : ""}
      </p>
    </section>
  );
}
