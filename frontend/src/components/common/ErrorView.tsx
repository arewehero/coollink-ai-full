"use client";

/**
 * ErrorView — 오류 화면 (명세서 §11.1, §14.2)
 */
export function ErrorView({
  title = "잠시 연결이 불안정해요.",
  message = "입력한 정보는 유지했어요. 다시 시도해주세요.",
  actionLabel = "다시 시도",
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-xs text-sm leading-6 text-neutral">{message}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
