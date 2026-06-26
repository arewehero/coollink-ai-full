"use client";

import { ErrorView } from "@/components/common/ErrorView";

/**
 * 공통 오류 경계 (명세서 §5 `/error`, §11.1 ErrorView, §14.2)
 * App Router의 error boundary로 동작한다.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      title="잠시 연결이 불안정해요."
      message="입력한 정보는 유지했어요. 다시 시도해주세요."
      actionLabel="다시 시도"
      onAction={reset}
    />
  );
}
