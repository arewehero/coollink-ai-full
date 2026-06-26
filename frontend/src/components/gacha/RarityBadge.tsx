/**
 * RarityBadge — 희귀도 배지
 */
import { RARITY_LABEL, type Rarity } from "@/data/endangeredSpecies";

const RARITY_STYLE: Record<Rarity, string> = {
  RARE: "bg-sky-100 text-sky-700",
  EPIC: "bg-violet-100 text-violet-700",
  LEGENDARY: "bg-amber-100 text-amber-700",
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${RARITY_STYLE[rarity]}`}
    >
      {RARITY_LABEL[rarity]}
    </span>
  );
}
