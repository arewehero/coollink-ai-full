"use client";

/**
 * ConfirmModal — 재생성/초기화 확인 (명세서 §11.1)
 * ESC 닫기, 배경 클릭 닫기, 포커스 가능한 버튼 제공 (명세서 §17).
 */
import { useEffect } from "react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-neutral">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white ${
              danger ? "bg-danger" : "bg-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
