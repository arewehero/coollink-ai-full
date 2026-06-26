/**
 * 룰렛 추첨 로직 (순수 함수) — 추후 서버 룰렛 API로 교체하기 쉽도록 분리.
 * 시연용 MVP라 6개 상품을 동일 확률로 뽑는다.
 */
import type { Prize } from "@/data/rewardPrizes";

export function drawPrize(
  prizes: Prize[],
  random: () => number = Math.random,
): Prize {
  if (prizes.length === 0) {
    throw new Error("상품 목록이 비어 있어요.");
  }
  const index = Math.floor(random() * prizes.length) % prizes.length;
  return prizes[index];
}
