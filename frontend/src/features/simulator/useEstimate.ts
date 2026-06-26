"use client";

/**
 * useEstimate — 요금 시뮬레이션 (명세서 §10.14, §22.4)
 * 입력값 변경 후 400ms debounce → POST /calculations/estimate.
 */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  CalculationEstimateBody,
  CalculationEstimateResponse,
} from "@/types/api";

export type EstimateStatus = "idle" | "loading" | "ready" | "error";

export function useEstimate(input: CalculationEstimateBody) {
  const [result, setResult] = useState<CalculationEstimateResponse | null>(
    null,
  );
  const [status, setStatus] = useState<EstimateStatus>("loading");

  // 입력 객체 대신 직렬화 키에 의존(매 렌더 새 객체 → 무한 effect 방지)
  const key = JSON.stringify(input);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const body = JSON.parse(key) as CalculationEstimateBody;

    const timer = setTimeout(() => {
      setStatus("loading");
      api
        .estimateCalculation(body, controller.signal)
        .then((r) => {
          if (!active) return;
          setResult(r);
          setStatus("ready");
        })
        .catch(() => {
          if (!active || controller.signal.aborted) return;
          setStatus("error");
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return { result, status };
}
