/**
 * 뽑기 상태 저장소 (localStorage 기반, useSyncExternalStore 호환)
 *
 * 기존 키(coollink_gacha_tickets / coollink_gacha_collection)는 그대로 유지하고,
 * 룰렛 보상 상태 키를 확장한다.
 * - 기본 뽑기권은 2장. 단, 키가 없을 때만 적용(기존 값은 덮어쓰지 않음).
 *
 * 추후 서버 연동 시 이 모듈만 교체하면 된다(읽기/쓰기 인터페이스 동일 유지).
 */
import { getStoredUserId } from "@/lib/storage/user";

// 기본(base) 키 — 로그인 계정별로 분리하기 위해 실제 저장 시 user id 접미사를 붙인다.
const BASE_TICKETS_KEY = "coollink_gacha_tickets";
const BASE_COLLECTION_KEY = "coollink_gacha_collection";
const BASE_DRAW_COUNTS_KEY = "coollink_gacha_draw_counts";
const BASE_ROULETTE_CLAIMED_KEY = "coollink_gacha_roulette_claimed";
const BASE_ROULETTE_PRIZE_KEY = "coollink_gacha_roulette_prize";

const DEFAULT_TICKETS = 2;

const BASE_KEYS = [
  BASE_TICKETS_KEY,
  BASE_COLLECTION_KEY,
  BASE_DRAW_COUNTS_KEY,
  BASE_ROULETTE_CLAIMED_KEY,
  BASE_ROULETTE_PRIZE_KEY,
];

// 현재 로그인한 DB 사용자 id. null이면 비로그인(게스트) 범위.
// 최초 로드 시 저장된 user id로 초기화해, 새로고침해도 같은 계정 데이터를 읽는다.
let currentUserId: string | null =
  typeof window !== "undefined" ? getStoredUserId() : null;

/** 계정별 분리 저장을 위해 기본 키에 user id 접미사를 붙인다(게스트는 접미사 없음). */
function scopedKey(base: string): string {
  return currentUserId ? `${base}::${currentUserId}` : base;
}

export type GachaSnapshot = {
  tickets: number;
  collection: string[];
  /** 종별 누적 뽑은 횟수 (중복 상한 판정용) */
  drawCounts: Record<string, number>;
  rouletteClaimed: boolean;
  roulettePrizeId: string | null;
};

const SERVER_SNAPSHOT: GachaSnapshot = {
  tickets: DEFAULT_TICKETS,
  collection: [],
  drawCounts: {},
  rouletteClaimed: false,
  roulettePrizeId: null,
};

// useSyncExternalStore는 동일 데이터에 동일 참조를 요구하므로 캐시한다.
let cache: GachaSnapshot | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): GachaSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  const TICKETS_KEY = scopedKey(BASE_TICKETS_KEY);
  const COLLECTION_KEY = scopedKey(BASE_COLLECTION_KEY);
  const DRAW_COUNTS_KEY = scopedKey(BASE_DRAW_COUNTS_KEY);
  const ROULETTE_CLAIMED_KEY = scopedKey(BASE_ROULETTE_CLAIMED_KEY);
  const ROULETTE_PRIZE_KEY = scopedKey(BASE_ROULETTE_PRIZE_KEY);
  let tickets = DEFAULT_TICKETS;
  let collection: string[] = [];
  const drawCounts: Record<string, number> = {};
  let rouletteClaimed = false;
  let roulettePrizeId: string | null = null;
  try {
    const rawTickets = window.localStorage.getItem(TICKETS_KEY);
    if (rawTickets !== null) {
      // 키가 있으면 기존 값 유지(덮어쓰지 않음)
      const parsed = Number(rawTickets);
      tickets = Number.isFinite(parsed) ? Math.max(0, parsed) : DEFAULT_TICKETS;
    }
    const rawCollection = window.localStorage.getItem(COLLECTION_KEY);
    if (rawCollection) {
      const parsed = JSON.parse(rawCollection);
      if (Array.isArray(parsed)) {
        collection = parsed.filter((x) => typeof x === "string");
      }
    }
    const rawCounts = window.localStorage.getItem(DRAW_COUNTS_KEY);
    if (rawCounts) {
      const parsed = JSON.parse(rawCounts);
      if (parsed && typeof parsed === "object") {
        for (const [id, n] of Object.entries(parsed)) {
          if (typeof n === "number" && Number.isFinite(n)) {
            drawCounts[id] = Math.max(0, Math.floor(n));
          }
        }
      }
    } else {
      // 마이그레이션: 기존 컬렉션은 1회 뽑은 것으로 간주(중복 상한 키 없을 때만)
      for (const id of collection) drawCounts[id] = 1;
    }
    rouletteClaimed = window.localStorage.getItem(ROULETTE_CLAIMED_KEY) === "1";
    const rawPrize = window.localStorage.getItem(ROULETTE_PRIZE_KEY);
    roulettePrizeId = rawPrize && rawPrize.length > 0 ? rawPrize : null;
  } catch {
    /* 접근/파싱 실패 — 기본값 */
  }
  return { tickets, collection, drawCounts, rouletteClaimed, roulettePrizeId };
}

function persist(next: GachaSnapshot): void {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      const TICKETS_KEY = scopedKey(BASE_TICKETS_KEY);
      const COLLECTION_KEY = scopedKey(BASE_COLLECTION_KEY);
      const DRAW_COUNTS_KEY = scopedKey(BASE_DRAW_COUNTS_KEY);
      const ROULETTE_CLAIMED_KEY = scopedKey(BASE_ROULETTE_CLAIMED_KEY);
      const ROULETTE_PRIZE_KEY = scopedKey(BASE_ROULETTE_PRIZE_KEY);
      window.localStorage.setItem(TICKETS_KEY, String(next.tickets));
      window.localStorage.setItem(
        COLLECTION_KEY,
        JSON.stringify(next.collection),
      );
      window.localStorage.setItem(
        DRAW_COUNTS_KEY,
        JSON.stringify(next.drawCounts),
      );
      window.localStorage.setItem(
        ROULETTE_CLAIMED_KEY,
        next.rouletteClaimed ? "1" : "0",
      );
      window.localStorage.setItem(
        ROULETTE_PRIZE_KEY,
        next.roulettePrizeId ?? "",
      );
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

export function getSnapshot(): GachaSnapshot {
  if (cache === null) cache = readFromStorage();
  return cache;
}

export function getServerSnapshot(): GachaSnapshot {
  return SERVER_SNAPSHOT;
}

/** 뽑기권 추가 (테스트용 +1 등) */
export function addTickets(amount: number): void {
  const current = getSnapshot();
  persist({ ...current, tickets: Math.max(0, current.tickets + amount) });
}

/** 뽑기권 1장 차감. 부족하면 false. */
export function consumeTicket(): boolean {
  const current = getSnapshot();
  if (current.tickets <= 0) return false;
  persist({ ...current, tickets: current.tickets - 1 });
  return true;
}

/** 컬렉션에 추가. 새로 추가됐으면 true(신규), 이미 있으면 false. */
export function addToCollection(id: string): boolean {
  const current = getSnapshot();
  if (current.collection.includes(id)) return false;
  persist({ ...current, collection: [...current.collection, id] });
  return true;
}

/**
 * 뽑기 결과 기록: 종별 누적 횟수 +1, 컬렉션에 추가.
 * @returns 신규 종이면 true.
 */
export function recordDraw(id: string): boolean {
  const current = getSnapshot();
  const isNew = !current.collection.includes(id);
  persist({
    ...current,
    collection: isNew ? [...current.collection, id] : current.collection,
    drawCounts: {
      ...current.drawCounts,
      [id]: (current.drawCounts[id] ?? 0) + 1,
    },
  });
  return isNew;
}

/** 룰렛 보상 확정. 이미 받았으면 무시. */
export function claimRoulettePrize(prizeId: string): void {
  const current = getSnapshot();
  if (current.rouletteClaimed) return;
  persist({ ...current, rouletteClaimed: true, roulettePrizeId: prizeId });
}

/**
 * 로그인 계정 전환 시 호출 — 저장 범위를 해당 user id로 바꾸고,
 * 캐시를 새 계정 데이터로 다시 읽어 구독자(useSyncExternalStore)에게 알린다.
 * (로그아웃 시 userId=null → 게스트 범위)
 */
export function setGachaUser(userId: string | null): void {
  const normalized = userId && userId.length > 0 ? userId : null;
  if (normalized === currentUserId) return; // 동일 계정 — 변경 없음
  currentUserId = normalized;
  cache = readFromStorage();
  listeners.forEach((listener) => listener());
}

/** 시연용 전체 초기화 — (현재 계정의) 키 제거 후 기본값(뽑기권 2장)으로 복귀 */
export function resetGachaData(): void {
  if (typeof window !== "undefined") {
    try {
      BASE_KEYS.forEach((base) =>
        window.localStorage.removeItem(scopedKey(base)),
      );
    } catch {
      /* 접근 불가 무시 */
    }
  }
  cache = readFromStorage();
  listeners.forEach((listener) => listener());
}
