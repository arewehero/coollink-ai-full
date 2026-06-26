"use client";

/**
 * ActionTimeline — 시간대별 행동 카드 리스트 (명세서 §10.7, §10.11)
 */
import type { RecommendationAction } from "@/types/api";
import { RecommendationActionCard } from "./RecommendationActionCard";

export function ActionTimeline({
  actions,
  onToggle,
  pendingActionIds,
}: {
  actions: RecommendationAction[];
  onToggle: (action: RecommendationAction) => void;
  pendingActionIds: ReadonlySet<string>;
}) {
  const sorted = [...actions].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">
        시간대별 절약 행동
      </h2>
      {sorted.map((action) => (
        <RecommendationActionCard
          key={action.action_id}
          action={action}
          onToggle={onToggle}
          pending={pendingActionIds.has(action.action_id)}
        />
      ))}
    </section>
  );
}
