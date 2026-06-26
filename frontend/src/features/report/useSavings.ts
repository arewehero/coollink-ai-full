"use client";

/**
 * useSavings — 절약 리포트 데이터 (명세서 §10.13)
 * 선택한 기간(오늘/주간/월간)의 GET /savings/summary 결과를 제공한다.
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SavingsPeriod, SavingsSummary } from "@/types/api";

export type SavingsStatus = "loading" | "ready" | "error";

export function useSavings() {
  const [period, setPeriod] = useState<SavingsPeriod>("today");
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [status, setStatus] = useState<SavingsStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api
      .getSavingsSummary({ period }, controller.signal)
      .then((s) => {
        if (!active) return;
        setSummary(s);
        setStatus("ready");
      })
      .catch(() => {
        if (!active || controller.signal.aborted) return;
        setStatus("error");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [period, attempt]);

  const changePeriod = useCallback(
    (next: SavingsPeriod) => {
      if (next === period) return;
      setStatus("loading");
      setSummary(null);
      setPeriod(next);
    },
    [period],
  );

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  return { period, summary, status, changePeriod, retry };
}
