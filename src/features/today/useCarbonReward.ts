"use client";

/**
 * useCarbonReward — 오늘 CO₂ 절감 진행도 + 뽑기권 보상
 *
 * todayReducedCo2 = 완료한 체크리스트 항목의 CO₂ 합(todayCompletedCo2Kg)
 *                   + 시연용 보너스(demoBonusKg)
 * CO₂가 1kg 넘을 때마다 공유 뽑기권 store에 1장씩 지급(날짜별 중복 방지).
 *
 * 계산은 carbonProgress.buildCarbonProgress(순수 함수)에 위임한다. 추후 완료 API가
 * { todayReducedCo2, monthlyReducedCo2, ... }를 내려주면 인자만 그 값으로 바꿔
 * 끼우면 되고, 반환 필드도 그 형태에 1:1로 맞춰 두었다.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useToast } from "@/components/common/ToastProvider";
import { getTodayKst } from "@/lib/format/date";
import {
  getServerSnapshot as gachaServerSnapshot,
  getSnapshot as gachaSnapshot,
  subscribe as gachaSubscribe,
} from "@/lib/gacha/store";
import {
  CO2_PER_TICKET_KG,
  buildCarbonProgress,
} from "@/lib/carbon/carbonProgress";
import {
  addDemoBonus,
  getServerSnapshot,
  getSnapshot,
  grantCarbonTickets,
  subscribe,
} from "@/lib/carbon/carbonReward";

const DEMO_STEP_KG = 0.1;

export function useCarbonReward(
  todayCompletedCo2Kg: number,
  monthlyCompletedCo2Kg?: number,
) {
  const carbon = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const gacha = useSyncExternalStore(
    gachaSubscribe,
    gachaSnapshot,
    gachaServerSnapshot,
  );
  const { showToast } = useToast();

  // 오늘 누적 = 완료 항목 합 + 시연용 보너스
  const safeToday = Number.isFinite(todayCompletedCo2Kg)
    ? Math.max(0, todayCompletedCo2Kg)
    : 0;
  const todayReducedCo2 = Math.max(0, safeToday + carbon.demoBonusKg);

  // 이번 달 누적 = (전달받은 월 합 또는 today) + 시연용 보너스
  const monthlyReducedCo2 =
    monthlyCompletedCo2Kg != null && Number.isFinite(monthlyCompletedCo2Kg)
      ? Math.max(0, monthlyCompletedCo2Kg) + carbon.demoBonusKg
      : todayReducedCo2;

  const progress = buildCarbonProgress({
    todayReducedCo2,
    monthlyReducedCo2,
  });

  // 절감량이 바뀔 때마다 미지급 뽑기권 지급 (중복 방지는 store에서 처리)
  useEffect(() => {
    const granted = grantCarbonTickets(progress.todayReducedCo2, getTodayKst());
    if (granted > 0) {
      showToast(`🎁 뽑기권 ${granted}장을 받았어요!`, "success");
    }
  }, [progress.todayReducedCo2, showToast]);

  const addDemoCo2 = useCallback(() => {
    addDemoBonus(DEMO_STEP_KG);
  }, []);

  return {
    // 공유 뽑기권 보유 수 (뽑기 탭과 항상 동일)
    tickets: gacha.tickets,
    // 카드 표시용 (기존 필드 유지)
    totalCo2Kg: progress.todayReducedCo2,
    earnedTickets: progress.ticketCount,
    progressPercent: Math.round(progress.progressRatio * 100),
    remainingKg: progress.remainingCo2ForNextTicket,
    perTicketKg: CO2_PER_TICKET_KG,
    demoStepKg: DEMO_STEP_KG,
    addDemoCo2,
    // 추후 완료 API 응답과 1:1 대응 (그대로 갈아끼우기 쉽게)
    todayReducedCo2: progress.todayReducedCo2,
    monthlyReducedCo2: progress.monthlyReducedCo2,
    ticketCount: progress.ticketCount,
    remainingCo2ForNextTicket: progress.remainingCo2ForNextTicket,
  };
}
