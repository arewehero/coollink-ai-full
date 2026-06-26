"use client";

/**
 * useGacha — 뽑기 + 컬렉션 + 룰렛 보상 (localStorage MVP)
 * 데이터(endangeredSpecies / rewardPrizes) + 로직(draw / roulette) + 저장(store)을 조합한다.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ENDANGERED_SPECIES, type Species } from "@/data/endangeredSpecies";
import { REWARD_PRIZES, getPrizeById, type Prize } from "@/data/rewardPrizes";
import { drawSpecies, getEligibleSpecies } from "@/lib/gacha/draw";
import { drawPrize } from "@/lib/gacha/roulette";
import {
  addTickets,
  claimRoulettePrize,
  consumeTicket,
  getServerSnapshot,
  getSnapshot,
  recordDraw,
  resetGachaData,
  subscribe,
} from "@/lib/gacha/store";
import { resetCarbonReward } from "@/lib/carbon/carbonReward";

export type GachaPhase = "idle" | "drawing" | "revealed";
export type RoulettePhase = "idle" | "spinning" | "done";
export type DrawResult = { species: Species; isNew: boolean };

const CYCLE_MS = 90;
const DRAW_MS = 1300;
const SPIN_MS = 2600;

export function useGacha() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const [phase, setPhase] = useState<GachaPhase>("idle");
  const [result, setResult] = useState<DrawResult | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);

  const [roulettePhase, setRoulettePhase] = useState<RoulettePhase>("idle");
  const [spinningPrize, setSpinningPrize] = useState<Prize | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  /* ── 뽑기 ── */
  // 중복 상한에 도달하지 않은(뽑을 수 있는) 종
  const eligibleCount = getEligibleSpecies(
    ENDANGERED_SPECIES,
    snapshot.drawCounts,
  ).length;
  const poolExhausted = eligibleCount === 0;

  const draw = useCallback(() => {
    if (phase === "drawing") return;
    const eligible = getEligibleSpecies(ENDANGERED_SPECIES, snapshot.drawCounts);
    if (eligible.length === 0) return; // 모든 종이 상한 도달
    if (!consumeTicket()) return;

    setResult(null);
    setPhase("drawing");
    intervalRef.current = setInterval(() => {
      setCycleIndex((i) => (i + 1) % ENDANGERED_SPECIES.length);
    }, CYCLE_MS);

    const picked = drawSpecies(eligible);
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const isNew = recordDraw(picked.id);
      setResult({ species: picked, isNew });
      setPhase("revealed");
    }, DRAW_MS);
  }, [phase, snapshot.drawCounts]);

  const addTestTicket = useCallback(() => {
    addTickets(1);
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
  }, []);

  /* ── 룰렛 보상 ── */
  const speciesTotal = ENDANGERED_SPECIES.length;
  const collectionComplete = snapshot.collection.length >= speciesTotal;
  const claimedPrize = snapshot.roulettePrizeId
    ? (getPrizeById(snapshot.roulettePrizeId) ?? null)
    : null;

  const spinRoulette = useCallback(() => {
    if (!collectionComplete) return;
    if (snapshot.rouletteClaimed) return;
    if (roulettePhase === "spinning") return;

    const prize = drawPrize(REWARD_PRIZES);
    setSpinningPrize(prize);
    setRoulettePhase("spinning");
    spinTimeoutRef.current = setTimeout(() => {
      claimRoulettePrize(prize.id);
      setRoulettePhase("done");
    }, SPIN_MS);
  }, [collectionComplete, snapshot.rouletteClaimed, roulettePhase]);

  const resetRoulettePhase = useCallback(() => {
    setRoulettePhase("idle");
    setSpinningPrize(null);
  }, []);

  /* ── 시연용 초기화 ── */
  const resetDemo = useCallback(() => {
    resetGachaData();
    resetCarbonReward();
    setPhase("idle");
    setResult(null);
    setRoulettePhase("idle");
    setSpinningPrize(null);
  }, []);

  return {
    // 뽑기
    tickets: snapshot.tickets,
    collection: snapshot.collection,
    phase,
    result,
    cycleSpecies: ENDANGERED_SPECIES[cycleIndex],
    canDraw: snapshot.tickets > 0 && phase !== "drawing" && !poolExhausted,
    poolExhausted,
    draw,
    addTestTicket,
    reset,
    // 컬렉션/보상
    speciesTotal,
    collectionComplete,
    rouletteClaimed: snapshot.rouletteClaimed,
    claimedPrize,
    roulettePhase,
    spinningPrize,
    spinRoulette,
    resetRoulettePhase,
    // 시연
    resetDemo,
  };
}
