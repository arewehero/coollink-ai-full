"use client";

/**
 * RecommendationActionCard — 개별 행동 카드 (명세서 §10.11, §10.12)
 *
 * 완료 시에도 opacity를 낮추지 않고 체크/배지로 성취감을 유지한다(명세서 §10.11).
 */
import type { Difficulty, RecommendationAction } from "@/types/api";
import { formatKrw } from "@/lib/format/money";
import { formatCo2, formatKwh } from "@/lib/format/energy";

function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  const tone =
    difficulty === "쉬움"
      ? "bg-primary-soft text-primary"
      : difficulty === "어려움"
        ? "bg-warning/15 text-warning"
        : "bg-background text-neutral";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {difficulty}
    </span>
  );
}

export function RecommendationActionCard({
  action,
  onToggle,
  pending = false,
}: {
  action: RecommendationAction;
  onToggle: (action: RecommendationAction) => void;
  pending?: boolean;
}) {
  const completed = action.is_completed;

  return (
    <article
      className={`rounded-2xl border p-4 ${
        completed ? "border-primary bg-primary-soft/40" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-neutral">
          {action.time_range}
        </span>
        <DifficultyChip difficulty={action.difficulty} />
        {completed ? (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <span aria-hidden>✓</span> 완료
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-bold text-foreground">{action.title}</h3>
      <p className="mt-1 text-sm leading-6 text-foreground">{action.action}</p>
      {action.reason ? (
        <p className="mt-2 text-xs leading-5 text-neutral">{action.reason}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-bold text-primary">
          {formatKrw(action.estimated_saving_krw)} 절약
        </span>
        <span className="text-neutral">
          {formatKwh(action.estimated_energy_saving_kwh)}
        </span>
        <span className="text-neutral">
          {formatCo2(action.estimated_co2_reduction_kg)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onToggle(action)}
        disabled={pending}
        aria-pressed={completed}
        className={`mt-3 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
          completed
            ? "border border-primary bg-surface text-primary"
            : "bg-primary text-white hover:opacity-90"
        }`}
      >
        {pending ? "처리 중…" : completed ? "완료됨" : "완료하기"}
      </button>
    </article>
  );
}
