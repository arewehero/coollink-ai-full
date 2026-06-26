/**
 * 탄소 절감 → 뽑기권 보상 (localStorage MVP)
 *
 * CO₂ 1kg 절감마다 뽑기권 1장. 하루 단위로 진행도/지급을 관리한다.
 * 뽑기권 자체는 기존 gacha store(coollink_gacha_tickets)를 공유하므로
 * 오늘 화면과 뽑기 탭의 보유 뽑기권 수가 항상 같다.
 *
 * 추후 서버 연동 시 이 모듈만 교체하면 된다.
 */
import { getTodayKst } from "@/lib/format/date";
import { addTickets } from "@/lib/gacha/store";
import { buildCarbonProgress } from "./carbonProgress";

/** CO₂ 1kg당 뽑기권 1장 (기준값은 carbonProgress에 정의 — 재노출) */
export { CO2_PER_TICKET_KG } from "./carbonProgress";

const DEMO_BONUS_KEY = "coollink_co2_demo_bonus";
const REWARDED_COUNT_KEY = "coollink_co2_rewarded_count";
const REWARD_DATE_KEY = "coollink_co2_reward_date";

export type CarbonSnapshot = {
  demoBonusKg: number;
  rewardedCount: number;
  rewardDate: string | null;
};

const SERVER_SNAPSHOT: CarbonSnapshot = {
  demoBonusKg: 0,
  rewardedCount: 0,
  rewardDate: null,
};

let cache: CarbonSnapshot | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): CarbonSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  let demoBonusKg = 0;
  let rewardedCount = 0;
  let rewardDate: string | null = null;
  try {
    const rawBonus = window.localStorage.getItem(DEMO_BONUS_KEY);
    if (rawBonus !== null) {
      const n = Number(rawBonus);
      if (Number.isFinite(n)) demoBonusKg = Math.max(0, n);
    }
    const rawCount = window.localStorage.getItem(REWARDED_COUNT_KEY);
    if (rawCount !== null) {
      const n = Number(rawCount);
      if (Number.isFinite(n)) rewardedCount = Math.max(0, Math.floor(n));
    }
    const rawDate = window.localStorage.getItem(REWARD_DATE_KEY);
    rewardDate = rawDate && rawDate.length > 0 ? rawDate : null;
  } catch {
    /* 접근/파싱 실패 — 기본값 */
  }
  return { demoBonusKg, rewardedCount, rewardDate };
}

function persist(next: CarbonSnapshot): void {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEMO_BONUS_KEY, String(next.demoBonusKg));
      window.localStorage.setItem(REWARDED_COUNT_KEY, String(next.rewardedCount));
      window.localStorage.setItem(REWARD_DATE_KEY, next.rewardDate ?? "");
    } catch {
      /* 저장 실패 무시 */
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): CarbonSnapshot {
  if (cache === null) cache = readFromStorage();
  return cache;
}

export function getServerSnapshot(): CarbonSnapshot {
  return SERVER_SNAPSHOT;
}

/** 시연용 CO₂ 보너스 추가 (+0.1kg 등). 실제 추천 절감량은 건드리지 않는다. */
export function addDemoBonus(kg: number): void {
  const current = getSnapshot();
  persist({ ...current, demoBonusKg: Math.max(0, current.demoBonusKg + kg) });
}

/**
 * 오늘 절감량 기준 미지급 뽑기권을 지급한다 (중복 방지 + 날짜 리셋).
 * 항상 최신 store 값을 읽으므로 StrictMode 이중 호출에도 중복 지급되지 않는다.
 * @returns 이번에 새로 지급한 뽑기권 수
 */
export function grantCarbonTickets(totalKg: number, today: string): number {
  const current = getSnapshot();
  const rewardedToday =
    current.rewardDate === today ? current.rewardedCount : 0;
  const earned = buildCarbonProgress({ todayReducedCo2: totalKg }).ticketCount;

  if (earned > rewardedToday) {
    const granted = earned - rewardedToday;
    addTickets(granted); // 공유 뽑기권 store
    persist({ ...current, rewardedCount: earned, rewardDate: today });
    return granted;
  }
  if (current.rewardDate !== today) {
    // 날짜가 바뀌면 카운트만 리셋(지급 없음)
    persist({ ...current, rewardedCount: 0, rewardDate: today });
  }
  return 0;
}

/** 편의: 오늘 날짜 기준 지급 */
export function grantCarbonTicketsForToday(totalKg: number): number {
  return grantCarbonTickets(totalKg, getTodayKst());
}

/** 시연용 초기화 — 탄소 보상 관련 키 제거 */
export function resetCarbonReward(): void {
  if (typeof window !== "undefined") {
    try {
      [DEMO_BONUS_KEY, REWARDED_COUNT_KEY, REWARD_DATE_KEY].forEach((key) =>
        window.localStorage.removeItem(key),
      );
    } catch {
      /* 접근 불가 무시 */
    }
  }
  cache = readFromStorage();
  listeners.forEach((listener) => listener());
}
