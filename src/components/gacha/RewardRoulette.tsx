"use client";

/**
 * RewardRoulette — 컬렉션 완성 보상 룰렛 (시연용 모달)
 * 원형 룰렛이 2.6초 회전 후 당첨 상품을 공개한다. 결과는 store에 저장(1회 한정).
 */
import { useEffect } from "react";
import { REWARD_PRIZES, type Prize } from "@/data/rewardPrizes";
import type { RoulettePhase } from "@/features/gacha/useGacha";

const SEGMENT_COLORS = [
  "#dcfce7",
  "#bbf7d0",
  "#a7f3d0",
  "#bae6fd",
  "#fde68a",
  "#ddd6fe",
];
const SEGMENT_DEG = 360 / REWARD_PRIZES.length;
const WHEEL_GRADIENT = `conic-gradient(from 0deg, ${SEGMENT_COLORS.map(
  (c, i) => `${c} ${i * SEGMENT_DEG}deg ${(i + 1) * SEGMENT_DEG}deg`,
).join(", ")})`;

function rotationForIndex(index: number): number {
  // 5바퀴 + 해당 칸을 상단 포인터(0deg)로 가져오는 각도
  return 360 * 5 + (360 - (index * SEGMENT_DEG + SEGMENT_DEG / 2));
}

export function RewardRoulette({
  open,
  phase,
  claimed,
  claimedPrize,
  spinningPrize,
  onSpin,
  onClose,
}: {
  open: boolean;
  phase: RoulettePhase;
  claimed: boolean;
  claimedPrize: Prize | null;
  spinningPrize: Prize | null;
  onSpin: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "spinning") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, onClose]);

  if (!open) return null;

  const showResult = claimed && phase !== "spinning";
  const resultPrize = claimedPrize ?? spinningPrize;
  const activeIndex = spinningPrize
    ? REWARD_PRIZES.findIndex((p) => p.id === spinningPrize.id)
    : 0;
  const rotation = phase === "spinning" ? rotationForIndex(activeIndex) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="컬렉션 완성 보상 룰렛"
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={() => phase !== "spinning" && onClose()}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="text-center text-base font-bold text-foreground">
          컬렉션 완성 보상 룰렛
        </h2>

        {showResult && resultPrize ? (
          <div className="mt-5 flex flex-col items-center gap-2 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-4xl">
              🎉
            </div>
            <p className="mt-1 text-base font-bold text-primary">
              {phase === "done" ? "축하해요!" : "이미 보상을 받았어요"}
            </p>
            <p className="text-lg font-bold text-foreground">
              {resultPrize.name}
            </p>
            <p className="max-w-[16rem] text-sm leading-6 text-neutral">
              {resultPrize.description}
            </p>
            <p className="mt-1 text-xs text-neutral">시연용 이벤트 보상입니다.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
            >
              확인
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-5">
            <div className="relative h-60 w-60">
              {/* 상단 포인터 */}
              <div
                aria-hidden
                className="absolute left-1/2 top-[-4px] z-10 -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "16px solid #16a34a",
                }}
              />
              {/* 룰렛 휠 */}
              <div
                className="h-60 w-60 rounded-full border-4 border-white shadow-lg"
                style={{
                  background: WHEEL_GRADIENT,
                  transform: `rotate(${rotation}deg)`,
                  transition:
                    phase === "spinning"
                      ? "transform 2.6s cubic-bezier(0.16, 1, 0.3, 1)"
                      : "none",
                }}
              />
              {/* 가운데 허브 */}
              <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-2xl shadow">
                🎁
              </div>
            </div>
            <p className="text-sm text-neutral">
              {phase === "spinning"
                ? "두근두근… 보상을 뽑는 중!"
                : "버튼을 누르면 룰렛이 돌아가요."}
            </p>
            <button
              type="button"
              onClick={onSpin}
              disabled={phase === "spinning"}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {phase === "spinning" ? "돌리는 중…" : "보상 룰렛 돌리기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
