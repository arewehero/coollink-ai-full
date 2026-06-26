/**
 * SavingsStatsGrid — 절약액/달성률/kWh/CO₂ 카드 (명세서 §10.13, §11.4)
 */
import type { SavingsSummary } from "@/types/api";
import { formatKrw, formatKrwPlain } from "@/lib/format/money";
import { formatCo2, formatKwh } from "@/lib/format/energy";

function StatCard({
  label,
  value,
  sub,
  highlight = false,
  wide = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${wide ? "col-span-2" : ""} ${
        highlight ? "border-primary bg-primary-soft" : "border-border bg-surface"
      }`}
    >
      <p className="text-xs text-neutral">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-neutral">{sub}</p> : null}
    </div>
  );
}

export function SavingsStatsGrid({ summary }: { summary: SavingsSummary }) {
  const rate =
    summary.total_possible_saving_krw > 0
      ? Math.round(
          (summary.total_saving_krw / summary.total_possible_saving_krw) * 100,
        )
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="총 절약액"
        value={formatKrw(summary.total_saving_krw)}
        sub={`${summary.completed_action_count} / ${summary.total_action_count} 행동 완료`}
        highlight
        wide
      />
      <StatCard
        label="가능 절약액 대비"
        value={`${rate}%`}
        sub={`최대 약 ${formatKrwPlain(summary.total_possible_saving_krw)}`}
      />
      <StatCard
        label="월 예상 절약액"
        value={formatKrw(summary.monthly_projected_saving_krw)}
      />
      <StatCard
        label="전력 절감량"
        value={formatKwh(summary.total_energy_saving_kwh)}
      />
      <StatCard
        label="CO₂ 감축량"
        value={formatCo2(summary.total_co2_reduction_kg)}
      />
    </div>
  );
}
