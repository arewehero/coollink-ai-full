/**
 * ProgressCard — 완료 행동 수 / 누적 절약액 / 진행률 (명세서 §10.7, §10.12)
 */
import type { TodayProgress } from "@/features/today/useToday";
import { formatKrwPlain } from "@/lib/format/money";

export function ProgressCard({
  progress,
}: {
  progress: TodayProgress | null;
}) {
  if (!progress) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="h-4 w-1/3 animate-pulse rounded bg-border" />
        <div className="mt-4 h-2 w-full animate-pulse rounded bg-border" />
      </section>
    );
  }

  const { completed, total, savedKrw } = progress;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-neutral">오늘의 실천</p>
          <p className="mt-0.5 text-lg font-bold text-foreground">
            {completed} / {total} 완료
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral">지금까지</p>
          <p className="mt-0.5 text-lg font-bold text-primary">
            약 {formatKrwPlain(savedKrw)} 절약
          </p>
        </div>
      </div>

      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {progress.message ? (
        <p className="mt-3 text-xs leading-5 text-neutral">{progress.message}</p>
      ) : null}
    </section>
  );
}
