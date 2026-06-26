"use client";

/**
 * GachaScreen — /gacha 멸종위기종 친구 뽑기 (localStorage MVP)
 */
import { useState } from "react";
import Image from "next/image";
import { useGacha, type DrawResult } from "./useGacha";
import { RarityBadge } from "@/components/gacha/RarityBadge";
import { CollectionGrid } from "@/components/gacha/CollectionGrid";
import { RewardRoulette } from "@/components/gacha/RewardRoulette";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { SPECIES_COUNT, type Species } from "@/data/endangeredSpecies";

function Capsule({
  species,
  drawing,
}: {
  species: Species;
  drawing: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative flex h-44 w-44 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-soft to-background ${
          drawing ? "animate-bounce" : ""
        }`}
      >
        <Image
          src={species.silhouette}
          alt="실루엣"
          width={150}
          height={150}
          priority
          className="object-contain opacity-85"
        />
        {!drawing ? (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            ?
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-neutral">
        {drawing ? "두근두근… 친구를 찾는 중!" : "어떤 멸종위기종 친구가 나올까요?"}
      </p>
    </div>
  );
}

function RevealCard({ result }: { result: DrawResult }) {
  const { species, isNew } = result;
  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <p className="text-base font-bold text-primary">🎉 축하해요!</p>
      <div className="relative h-32 w-32">
        <Image
          src={species.image}
          alt={species.nameKo}
          fill
          sizes="128px"
          priority
          className="object-contain drop-shadow-md"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-foreground">{species.nameKo}</span>
        <RarityBadge rarity={species.rarity} />
      </div>
      <span className="text-xs text-neutral">{species.nameEn}</span>
      <p className="mt-1 max-w-[16rem] text-sm leading-6 text-neutral">
        {species.description}
      </p>
      <span
        className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold ${
          isNew ? "bg-primary-soft text-primary" : "bg-background text-neutral"
        }`}
      >
        {isNew ? "컬렉션에 추가되었어요!" : "이미 만난 친구예요"}
      </span>
    </div>
  );
}

export function GachaScreen() {
  const gacha = useGacha();
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="멸종위기종 친구 뽑기"
        subtitle={`보유 뽑기권 ${gacha.tickets}장`}
      />
      <div className="flex flex-col gap-5 px-5 py-6">
        <p className="text-sm leading-6 text-neutral">
          탄소 절감 미션을 달성하면 멸종위기종 친구를 만날 수 있어요.
        </p>

        <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            보유 뽑기권 {gacha.tickets}장
          </span>

          <div className="flex w-full items-center justify-center py-2">
            {gacha.phase === "revealed" && gacha.result ? (
              <RevealCard result={gacha.result} />
            ) : (
              <Capsule
                species={gacha.cycleSpecies}
                drawing={gacha.phase === "drawing"}
              />
            )}
          </div>

          {gacha.phase === "revealed" ? (
            <button
              type="button"
              onClick={gacha.reset}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:opacity-90"
            >
              확인
            </button>
          ) : (
            <button
              type="button"
              onClick={gacha.draw}
              disabled={!gacha.canDraw}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {gacha.phase === "drawing" ? "뽑는 중…" : "뽑기하기"}
            </button>
          )}

          {gacha.poolExhausted ? (
            <p className="text-xs font-semibold text-primary">
              🎉 모든 멸종위기종을 다 만났어요!
            </p>
          ) : gacha.tickets <= 0 && gacha.phase !== "drawing" ? (
            <p className="text-xs text-neutral">
              뽑기권이 없어요. 아래 버튼으로 테스트 뽑기권을 받아보세요.
            </p>
          ) : null}

          <button
            type="button"
            onClick={gacha.addTestTicket}
            className="w-full rounded-full border border-border bg-surface py-3 text-sm font-semibold text-foreground"
          >
            테스트용 뽑기권 +1
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">내 컬렉션</h2>
            <span className="text-xs text-neutral">
              {gacha.collection.length} / {SPECIES_COUNT}
            </span>
          </div>
          <CollectionGrid owned={gacha.collection} />
        </section>

        {/* 컬렉션 완성 보상 */}
        <section className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft/50 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-foreground">컬렉션 완성 보상</h2>
            <span className="text-xs font-semibold text-primary">
              {gacha.collection.length} / {gacha.speciesTotal} 수집 완료
            </span>
          </div>
          <p className="text-sm leading-6 text-neutral">
            멸종위기종 친구를 모두 모으면 룰렛 이벤트에 참여할 수 있어요.
          </p>
          <button
            type="button"
            disabled={!gacha.collectionComplete}
            onClick={() => setRouletteOpen(true)}
            className={`w-full rounded-full py-3.5 text-sm font-bold ${
              gacha.collectionComplete
                ? "bg-primary text-white transition-colors hover:opacity-90"
                : "cursor-not-allowed bg-border text-neutral"
            }`}
          >
            {gacha.collectionComplete
              ? gacha.rouletteClaimed
                ? "보상 결과 보기"
                : "보상 룰렛 돌리기"
              : "컬렉션을 모두 모으면 열려요"}
          </button>
          {!gacha.collectionComplete ? (
            <p className="text-center text-xs text-neutral">
              {gacha.speciesTotal - gacha.collection.length}종 더 모으면 열려요.
            </p>
          ) : null}
        </section>

        {/* 시연용 초기화 (눈에 띄지 않게) */}
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="mx-auto mt-1 text-xs text-neutral underline underline-offset-2"
        >
          시연 데이터 초기화
        </button>
      </div>

      <RewardRoulette
        open={rouletteOpen}
        phase={gacha.roulettePhase}
        claimed={gacha.rouletteClaimed}
        claimedPrize={gacha.claimedPrize}
        spinningPrize={gacha.spinningPrize}
        onSpin={gacha.spinRoulette}
        onClose={() => {
          setRouletteOpen(false);
          gacha.resetRoulettePhase();
        }}
      />

      <ConfirmModal
        open={resetOpen}
        title="시연 데이터를 초기화할까요?"
        message="뽑기권·컬렉션·룰렛 보상 기록이 모두 지워지고, 기본 뽑기권 2장부터 다시 시작해요."
        confirmLabel="초기화"
        danger
        onConfirm={() => {
          gacha.resetDemo();
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </>
  );
}
