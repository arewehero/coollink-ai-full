"use client";

/**
 * TodayScreen — /today 화면 조립 (명세서 §10.7)
 *
 * 순서: 절약 요약 → 날씨 → AI 유형 → 진행률 → 시간대별 행동 → 안내
 */
import Link from "next/link";
import { useToday } from "./useToday";
import { getTodayLabelKst } from "@/lib/format/date";
import { TodayHeader } from "@/components/today/TodayHeader";
import { DailySavingSummaryCard } from "@/components/today/DailySavingSummaryCard";
import { CarbonRewardCard } from "@/components/today/CarbonRewardCard";
import { WeatherSummaryCard } from "@/components/today/WeatherSummaryCard";
import { LifestyleAnalysisCard } from "@/components/today/LifestyleAnalysisCard";
import { ProgressCard } from "@/components/today/ProgressCard";
import { ActionTimeline } from "@/components/today/ActionTimeline";
import { AssumptionNotice } from "@/components/today/AssumptionNotice";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorView } from "@/components/common/ErrorView";
import { sumCompletedCo2 } from "@/lib/carbon/carbonProgress";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function TodayScreen() {
  const today = useToday();
  const auth = useAuth();
  const router = useRouter();
  const dateLabel = getTodayLabelKst();

  const handleLogout = () => {
    console.log("logout clicked");
    auth.logout();
    router.replace("/");
  };

  if (today.status === "loading") {
    return (
      <>
        <TodayHeader
          dateLabel={dateLabel}
          regionName={today.regionName}
          onLogout={handleLogout}
        />
        <div className="flex flex-col gap-4 px-5 py-6">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={2} />
          <SkeletonCard rows={4} />
        </div>
      </>
    );
  }

  if (today.status === "error" || !today.plan) {
    return (
      <>
        <TodayHeader
          dateLabel={dateLabel}
          regionName={today.regionName}
          onLogout={handleLogout}
        />
        <ErrorView
          title="오늘의 루틴을 불러오지 못했어요."
          message="잠시 후 다시 시도해주세요."
          actionLabel="다시 시도"
          onAction={today.retry}
        />
      </>
    );
  }

  const plan = today.plan;
  // 오늘 완료한 체크리스트 항목들의 CO₂ 합 → 뽑기권 진행 카드의 기준값.
  // (낙관적 업데이트된 plan.actions를 쓰므로 완료 즉시 카드가 갱신된다.)
  const todayCompletedCo2Kg = sumCompletedCo2(plan.actions);

  return (
    <>
      <TodayHeader
        dateLabel={dateLabel}
        regionName={today.regionName}
        onRefresh={today.retry}
        onLogout={handleLogout}
      />
      <div className="flex flex-col gap-4 px-5 py-6">
        {plan.status === "fallback" ? (
          <div
            role="status"
            className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3"
          >
            <p className="text-sm font-semibold text-foreground">
              AI 분석이 지연되어 기본 절약 루틴으로 먼저 보여드려요.
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral">
              나중에 다시 생성하면 더 개인화된 추천을 받을 수 있어요.
            </p>
          </div>
        ) : null}
        <DailySavingSummaryCard summary={plan.daily_summary} />
        <CarbonRewardCard todayCompletedCo2Kg={todayCompletedCo2Kg} />
        <WeatherSummaryCard status={today.weatherStatus} weather={today.weather} />

        {/* 요금 시뮬레이터 진입 — 날씨와 AI 분석 사이, 강조 스타일로 잘 보이게 */}
        <Link
          href="/simulator"
          className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-4"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path
                  d="M4 8h8M16 8h4M4 16h4M12 16h8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="14" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="10" cy="16" r="2.3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold text-foreground">
                요금 시뮬레이션
              </span>
              <span className="text-xs text-neutral">
                온도·시간을 바꿔 예상 절약액 확인
              </span>
            </span>
          </span>
          <span aria-hidden className="text-primary">›</span>
        </Link>

        <LifestyleAnalysisCard analysis={plan.lifestyle_analysis} />
        <ProgressCard progress={today.progress} />
        <ActionTimeline
          actions={plan.actions}
          onToggle={today.toggleAction}
          pendingActionIds={today.pendingActionIds}
        />
        <AssumptionNotice />
      </div>
    </>
  );
}
