/**
 * DailySavingSummaryCard — 오늘/월 예상 절약액 (명세서 §10.8)
 */
import type { DailySummary } from "@/types/api";
import { formatKrw, formatKrwMonthly } from "@/lib/format/money";
import { formatCo2, formatKwh } from "@/lib/format/energy";

export function DailySavingSummaryCard({
  summary,
}: {
  summary: DailySummary;
}) {
  return (
    <section className="rounded-2xl bg-primary p-5 text-white">
      <p className="text-sm/6 opacity-90">
        오늘 추천 행동을 모두 실천하면
      </p>
      <p className="mt-1 text-2xl font-bold">
        {formatKrw(summary.total_estimated_saving_krw)} 절약 가능
      </p>
      <p className="mt-1 text-sm opacity-90">
        이 흐름을 유지하면 {formatKrwMonthly(summary.monthly_estimated_saving_krw)}
      </p>

      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          {formatKwh(summary.total_energy_saving_kwh)}
        </span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          {formatCo2(summary.total_co2_reduction_kg)} 감축
        </span>
      </div>

      {summary.cheer_message ? (
        <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs leading-5">
          {summary.cheer_message}
        </p>
      ) : null}
    </section>
  );
}
