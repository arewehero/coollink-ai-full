"use client";

/**
 * useBootstrap — `/` 인트로의 부트스트랩 트리거 (명세서 §6.2, §10.1)
 *
 * 자동 실행하지 않고, 인트로 버튼에서 start()를 호출할 때 부트스트랩을 시작한다.
 * 성공 시 has_profile 분기로 /onboarding 또는 /today로 replace 이동,
 * 실패 시 status='error'로 재시도 UI를 노출한다.
 * 핵심 로직(bootstrapApp)은 features/bootstrap/bootstrap.ts 그대로 사용한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bootstrapApp } from "@/features/bootstrap/bootstrap";

export type BootstrapStatus = "idle" | "loading" | "error";

export function useBootstrap() {
  const router = useRouter();
  const [status, setStatus] = useState<BootstrapStatus>("idle");
  const controllerRef = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    // 이전 시도가 있으면 취소하고 새로 시작 (재시도 포함)
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("loading");

    bootstrapApp(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        router.replace(result.destination);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setStatus("error");
      });
  }, [router]);

  // 언마운트 시 진행 중 요청 정리
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  return { status, start };
}
