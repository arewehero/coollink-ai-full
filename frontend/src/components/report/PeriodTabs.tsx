"use client";

/**
 * PeriodTabs — 오늘/주간/월간 탭 (명세서 §10.13, §11.4)
 */
import type { SavingsPeriod } from "@/types/api";

const TABS: { key: SavingsPeriod; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
];

export function PeriodTabs({
  value,
  onChange,
}: {
  value: SavingsPeriod;
  onChange: (period: SavingsPeriod) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 rounded-full bg-border/60 p-1">
      {TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              active ? "bg-surface text-primary shadow-sm" : "text-neutral"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
