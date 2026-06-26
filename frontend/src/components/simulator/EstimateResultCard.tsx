/**
 * EstimateResultCard — current/target/saving 비교 (명세서 §10.14, §11.4)
 */
import type { CalculationEstimateResponse } from "@/types/api";
import { formatKrw } from "@/lib/format/money";
import { formatCo2, formatKwh } from "@/lib/format/energy";

export function EstimateResultCard({
  result,
  targetTemp,
}: {
  result: CalculationEstimateResponse;
  targetTemp: number;
}) {
  const { saving, current, target } = result;
  const positive = saving.saving_krw > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl bg-primary p-5 text-white">
        <p className="text-sm opacity-90">{targetTemp}°C로 맞추면</p>
        {positive ? (
          <>
            <p className="mt-1 text-2xl font-bold">
              하루 {formatKrw(saving.saving_krw)} 절약
            </p>
            <p className="mt-1 text-sm opacity-90">
              전력 약 {formatKwh(saving.energy_saving_kwh)},{" "}
              {formatCo2(saving.co2_reduction_kg)} 감축
            </p>
          </>
        ) : (
          <p className="mt-1 text-base font-semibold">
            현재 설정보다 시원해서 절약 효과는 크지 않아요.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-neutral">현재 설정</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatKrw(current.cost_krw)}
          </p>
          <p className="mt-0.5 text-xs text-neutral">
            {formatKwh(current.energy_kwh)}
          </p>
        </div>
        <div className="rounded-2xl border border-primary bg-primary-soft p-4">
          <p className="text-xs text-primary">목표 설정</p>
          <p className="mt-1 text-lg font-bold text-primary">
            {formatKrw(target.cost_krw)}
          </p>
          <p className="mt-0.5 text-xs text-neutral">
            {formatKwh(target.energy_kwh)}
          </p>
        </div>
      </div>

      <p className="px-1 text-xs leading-5 text-neutral">
        실제 청구 요금은 누진세, 사용 시간, 기기 효율에 따라 달라질 수 있어요.
      </p>
    </section>
  );
}
