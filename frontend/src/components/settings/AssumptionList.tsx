/**
 * AssumptionList — 계산 기준값 표시 (명세서 §10.15, §11.4)
 */
import type { MetaAssumptions } from "@/types/api";

export function AssumptionList({
  assumptions,
}: {
  assumptions: MetaAssumptions;
}) {
  const rows: { label: string; value: string }[] = [];
  if (typeof assumptions.co2_factor_kg_per_kwh === "number") {
    rows.push({
      label: "CO₂ 배출계수",
      value: `${assumptions.co2_factor_kg_per_kwh} kg/kWh`,
    });
  }
  if (typeof assumptions.electricity_unit_price_krw_per_kwh === "number") {
    rows.push({
      label: "전기요금 단가",
      value: `${assumptions.electricity_unit_price_krw_per_kwh} 원/kWh`,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.length > 0 ? (
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 last:border-b-0"
            >
              <span className="text-sm text-neutral">{row.label}</span>
              <span className="text-sm font-semibold text-foreground">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {assumptions.notes && assumptions.notes.length > 0 ? (
        <ul className="flex flex-col gap-1.5 px-1">
          {assumptions.notes.map((note) => (
            <li key={note} className="flex gap-2 text-xs leading-5 text-neutral">
              <span aria-hidden className="text-primary">
                •
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
