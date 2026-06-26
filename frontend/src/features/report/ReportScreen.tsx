"use client";

/**
 * ReportScreen — /report 절약 리포트 (명세서 §10.13)
 * 기간 탭 + 절약액/kWh/CO₂ 카드 + 월 목표 카드. (월간 캘린더는 후속)
 */
import Link from "next/link";
import { useSavings } from "./useSavings";
import { PeriodTabs } from "@/components/report/PeriodTabs";
import { SavingsStatsGrid } from "@/components/report/SavingsStatsGrid";
import { GoalProgressCard } from "@/components/report/GoalProgressCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorView } from "@/components/common/ErrorView";

export function ReportScreen() {
  const { period, summary, status, changePeriod, retry } = useSavings();

  return (
    <>
      <PageHeader title="절약 리포트" subtitle="오늘 · 이번 주 · 이번 달" />
      <div className="flex flex-col gap-4 px-5 py-6">
        <PeriodTabs value={period} onChange={changePeriod} />

        {status === "loading" ? (
          <>
            <SkeletonCard rows={2} />
            <SkeletonCard rows={3} />
          </>
        ) : status === "error" || !summary ? (
          <ErrorView
            title="리포트를 불러오지 못했어요."
            message="잠시 후 다시 시도해주세요."
            actionLabel="다시 시도"
            onAction={retry}
          />
        ) : (
          <>
            {summary.completed_action_count === 0 ? (
              <div className="rounded-xl bg-primary-soft px-4 py-3 text-sm leading-6 text-foreground">
                아직 완료한 절약 행동이 없어요.{" "}
                <Link href="/today" className="font-semibold text-primary">
                  오늘 첫 행동을 체크
                </Link>
                하면 리포트가 채워져요.
              </div>
            ) : null}
            <SavingsStatsGrid summary={summary} />
            <GoalProgressCard goal={summary.goal} />
            {summary.message ? (
              <p className="px-1 text-center text-xs text-neutral">
                {summary.message}
              </p>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
