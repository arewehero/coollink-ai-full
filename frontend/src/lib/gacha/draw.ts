/**
 * 뽑기 로직 (순수 함수) — 추후 서버 뽑기 API로 교체하기 쉽도록 분리.
 * 희귀도가 높을수록 낮은 확률로 나오도록 가중치를 둔다.
 */
import type { Rarity, Species } from "@/data/endangeredSpecies";

export const RARITY_WEIGHT: Record<Rarity, number> = {
  RARE: 6,
  EPIC: 3,
  LEGENDARY: 1,
};

/**
 * 희귀도별 최대 보유(중복 포함) 수.
 * 친구(RARE) 5 · 레어(EPIC) 3 · 초레어(LEGENDARY) 1.
 * cap에 도달한 종은 풀에서 제외되어, 흔한 종이 채워질수록 희귀 종이 더 잘 나온다.
 */
export const DUPLICATE_CAP: Record<Rarity, number> = {
  RARE: 5,
  EPIC: 3,
  LEGENDARY: 1,
};

/** 아직 중복 상한에 도달하지 않은(뽑을 수 있는) 종만 반환 */
export function getEligibleSpecies(
  pool: Species[],
  drawCounts: Record<string, number>,
): Species[] {
  return pool.filter((s) => (drawCounts[s.id] ?? 0) < DUPLICATE_CAP[s.rarity]);
}

/** 가중치 기반 랜덤 1종 추첨. random은 테스트 주입용(기본 Math.random). */
export function drawSpecies(
  pool: Species[],
  random: () => number = Math.random,
): Species {
  if (pool.length === 0) {
    throw new Error("뽑기 풀이 비어 있어요.");
  }
  const weights = pool.map((s) => RARITY_WEIGHT[s.rarity]);
  const total = weights.reduce((acc, w) => acc + w, 0);

  let roll = random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll < 0) return pool[i];
  }
  return pool[pool.length - 1];
}
