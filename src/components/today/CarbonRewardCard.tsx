"use client";

/**
 * CarbonRewardCard — 탄소 절감 뽑기권 진행도 (명세서 외 확장 기능)
 *
 * 오늘 절감량 = 완료한 체크리스트 항목의 CO₂ 합(todayCompletedCo2Kg).
 * CO₂ 1kg 절감마다 뽑기권 1장. 진행 바로 다음 뽑기권까지 남은 양을 보여준다.
 */
import { useCarbonReward } from "@/features/today/useCarbonReward";
import { formatCo2 } from "@/lib/format/energy";

export function CarbonRewardCard({
  todayCompletedCo2Kg,
  monthlyCompletedCo2Kg,
}: {
  /** 오늘 완료한 체크리스트 항목들의 CO₂ 절감량 합(kg) */
  todayCompletedCo2Kg: number;
  /** 이번 달 누적 CO₂ 절감량(kg) — 선택(추후 API). 없으면 today 기준 */
  monthlyCompletedCo2Kg?: number;
}) {
  const reward = useCarbonReward(todayCompletedCo2Kg, monthlyCompletedCo2Kg);

  const remainingText =
    reward.earnedTickets === 0
      ? `${reward.remainingKg.toFixed(2)}kg만 더 줄이면 뽑기권 1장!`
      : `다음 뽑기권까지 ${reward.remainingKg.toFixed(2)}kg 남았어요`;

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-soft to-[#eef9f0] p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">뽑기권까지 한 걸음!</h2>
        <span className="rounded-full bg-surface/80 px-2.5 py-1 text-xs font-semibold text-primary">
          🎁 보유 뽑기권 {reward.tickets}장
        </span>
      </div>

      <p className="mt-2.5 text-sm text-foreground">
        오늘 {formatCo2(reward.totalCo2Kg)}를 줄였어요
      </p>
      <p className="mt-0.5 text-xs font-semibold text-primary">{remainingText}</p>
      {reward.todayReducedCo2 === 0 ? (
        <p className="mt-1 text-[11px] text-neutral">
          아래 절약 행동을 완료하면 CO₂가 쌓여요.
        </p>
      ) : null}

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface/70"
        role="progressbar"
        aria-valuenow={reward.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="뽑기권 진행도"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${reward.progressPercent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-neutral">
          🎁 {reward.perTicketKg}kg CO₂ 절감마다 뽑기권 1장
        </span>
        <button
          type="button"
          onClick={reward.addDemoCo2}
          className="shrink-0 rounded-full border border-primary/30 bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-neutral transition-colors hover:text-primary"
        >
          시연용 CO₂ +{reward.demoStepKg}kg
        </button>
      </div>
    </section>
  );
}
