/**
 * 탄소 절감 진행도 계산 (순수 함수 — React·localStorage 비의존)
 *
 * 계산 로직만 한곳에 모은다. 지금은 백엔드 미연동이라, 완료한 체크리스트
 * 항목의 CO₂ 합(sumCompletedCo2)을 오늘 누적 절감량으로 사용한다.
 *
 * 추후 "완료 처리" API가 아래 CarbonProgress 형태
 * ({ todayReducedCo2, monthlyReducedCo2, ticketCount, remainingCo2ForNextTicket })
 * 를 그대로 내려주면, 프론트 합산 대신 그 응답을 buildCarbonProgress(...) 입력으로
 * 넣어 상단 카드를 갱신할 수 있다(인자만 교체).
 */

/** CO₂ 1kg당 뽑기권 1장 (기준값 — 여기만 바꾸면 됨) */
export const CO2_PER_TICKET_KG = 1;

/** 상단 뽑기권 카드 갱신 모델 (= 추후 완료 API 응답 형태) */
export type CarbonProgress = {
  /** 오늘 누적 CO₂ 절감량(kg) */
  todayReducedCo2: number;
  /** 이번 달 누적 CO₂ 절감량(kg) */
  monthlyReducedCo2: number;
  /** 오늘 절감량으로 획득한 뽑기권 수 */
  ticketCount: number;
  /** 다음 뽑기권까지 남은 CO₂(kg) */
  remainingCo2ForNextTicket: number;
  /** 진행 바 비율 (0~1) */
  progressRatio: number;
};

/** 완료 여부 + CO₂ 절감량을 가진 항목 (RecommendationAction 호환 최소 형태) */
type CompletableAction = {
  is_completed: boolean;
  estimated_co2_reduction_kg: number;
};

function safeKg(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * 완료된 항목들의 CO₂ 절감량 합 (프론트 상태 기반 오늘 누적값).
 *
 * is_completed가 true인 항목만 더하므로, 이미 완료한 항목을 다시 눌러도
 * 중복 합산되지 않는다(완료 취소 시에도 자동으로 빠진다).
 */
export function sumCompletedCo2(actions: readonly CompletableAction[]): number {
  return actions.reduce(
    (sum, a) =>
      a.is_completed ? sum + safeKg(a.estimated_co2_reduction_kg) : sum,
    0,
  );
}

/**
 * 누적 CO₂(today/monthly)로부터 카드 표시 모델을 만든다.
 *
 * @param input.todayReducedCo2   오늘 누적 CO₂(kg) — 프론트 합 또는 API 값
 * @param input.monthlyReducedCo2 이번 달 누적 CO₂(kg) — 없으면 today로 대체
 */
export function buildCarbonProgress(input: {
  todayReducedCo2: number;
  monthlyReducedCo2?: number;
}): CarbonProgress {
  const per = CO2_PER_TICKET_KG;
  const today = safeKg(input.todayReducedCo2);
  const monthly = Math.max(today, safeKg(input.monthlyReducedCo2 ?? today));

  const ticketCount = per > 0 ? Math.floor(today / per) : 0;
  const intoNext = today - ticketCount * per;
  const remainingCo2ForNextTicket = Math.max(0, per - intoNext);
  const progressRatio = per > 0 ? Math.min(1, intoNext / per) : 0;

  return {
    todayReducedCo2: today,
    monthlyReducedCo2: monthly,
    ticketCount,
    remainingCo2ForNextTicket,
    progressRatio,
  };
}
