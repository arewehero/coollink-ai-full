"use client";

/**
 * SimulatorScreen — /simulator 요금 시뮬레이션 (명세서 §10.14)
 * 온도/시간 입력 → debounce → /calculations/estimate 결과 표시.
 */
import { useState } from "react";
import { CalculationSimulatorForm } from "@/components/simulator/CalculationSimulatorForm";
import { EstimateResultCard } from "@/components/simulator/EstimateResultCard";
import { useEstimate } from "./useEstimate";
import { DEFAULT_SIM_INPUT, type SimInput } from "./types";
import { PageHeader } from "@/components/common/PageHeader";
import { SkeletonCard } from "@/components/common/SkeletonCard";

export function SimulatorScreen() {
  const [input, setInput] = useState<SimInput>(DEFAULT_SIM_INPUT);
  const { result, status } = useEstimate(input);

  const patch = (p: Partial<SimInput>) =>
    setInput((prev) => ({ ...prev, ...p }));

  return (
    <>
      <PageHeader
        title="요금 시뮬레이션"
        subtitle="온도·시간을 바꿔 예상 절약액을 확인해요"
      />
      <div className="flex flex-col gap-4 px-5 py-6">
        <CalculationSimulatorForm value={input} onChange={patch} />

        {status === "error" ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-5 text-center text-sm text-neutral">
            계산에 실패했어요. 입력값을 확인하고 잠시 후 다시 시도해주세요.
          </p>
        ) : status === "ready" && result ? (
          <EstimateResultCard
            result={result}
            targetTemp={input.target_temperature_setting}
          />
        ) : (
          <SkeletonCard rows={3} />
        )}
      </div>
    </>
  );
}
