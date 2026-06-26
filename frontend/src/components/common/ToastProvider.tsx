"use client";

/**
 * ToastProvider — 전역 알림 토스트 (명세서 §11.1, §10.12)
 *
 * useToast().showToast(message, variant)로 어디서든 토스트를 띄운다.
 * 완료/취소/오류 피드백을 일관되게 표시하며 자동으로 사라진다.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "info" | "error";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있어요.");
  }
  return ctx;
}

const AUTO_DISMISS_MS = 2800;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = (idRef.current += 1);
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2.5rem)] max-w-[440px] -translate-x-1/2 flex-col gap-2">
          {toasts.map((toast) => (
            <ToastBubble key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

function ToastBubble({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const tone =
    toast.variant === "success"
      ? "bg-primary text-white"
      : toast.variant === "error"
        ? "bg-danger text-white"
        : "bg-foreground/95 text-white";

  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto w-full rounded-xl px-4 py-3 text-center text-sm shadow-lg ${tone}`}
    >
      {toast.message}
    </button>
  );
}
