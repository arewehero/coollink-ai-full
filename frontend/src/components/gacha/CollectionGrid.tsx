/**
 * CollectionGrid — 내 컬렉션 그리드
 * 보유 종은 컬러, 미보유 종은 실루엣으로 표시한다.
 */
import Image from "next/image";
import { ENDANGERED_SPECIES } from "@/data/endangeredSpecies";

export function CollectionGrid({ owned }: { owned: string[] }) {
  const ownedSet = new Set(owned);

  return (
    <div className="grid grid-cols-3 gap-3">
      {ENDANGERED_SPECIES.map((s) => {
        const has = ownedSet.has(s.id);
        return (
          <div
            key={s.id}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 ${
              has ? "border-primary/30 bg-primary-soft/40" : "border-border bg-surface"
            }`}
          >
            <div className="relative h-16 w-16">
              <Image
                src={has ? s.image : s.silhouette}
                alt={has ? s.nameKo : "아직 만나지 못한 친구"}
                fill
                sizes="64px"
                className={`object-contain ${has ? "" : "opacity-80"}`}
              />
            </div>
            <span
              className={`text-center text-[11px] font-medium ${
                has ? "text-foreground" : "text-neutral"
              }`}
            >
              {has ? s.nameKo : "???"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
