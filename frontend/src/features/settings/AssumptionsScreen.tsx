"use client";

/**
 * AssumptionsScreen — /settings/assumptions 계산 기준 안내 (명세서 §10.15, §20.2)
 */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MetaAssumptions } from "@/types/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorView } from "@/components/common/ErrorView";
import { AssumptionList } from "@/components/settings/AssumptionList";

export function AssumptionsScreen() {
  const [data, setData] = useState<MetaAssumptions | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api
      .getAssumptions(controller.signal)
      .then((d) => {
        if (!active) return;
        setData(d);
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
  }, [attempt]);

  return (
    <>
      <PageHeader
        title="계산 기준 안내"
        subtitle="CO₂ 계수 · 단가 · 예상값 안내"
      />
      <div className="flex flex-col gap-4 px-5 py-6">
        <p className="text-sm leading-6 text-neutral">
          절약액·전력·CO₂ 수치는 아래 기준값을 바탕으로 한 추정치예요. CoolLink는
          금액을 직접 만들지 않고 계산 결과만 보여드려요.
        </p>

        {status === "loading" ? (
          <SkeletonCard rows={3} />
        ) : status === "error" || !data ? (
          <ErrorView
            title="기준값을 불러오지 못했어요."
            message="잠시 후 다시 시도해주세요."
            actionLabel="다시 시도"
            onAction={() => {
              setStatus("loading");
              setAttempt((n) => n + 1);
            }}
          />
        ) : (
          <AssumptionList assumptions={data} />
        )}
      </div>
    </>
  );
}
