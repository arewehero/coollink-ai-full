"use client";

/**
 * ToggleField — boolean 토글 (명세서 §11.2, 선풍기 보유 여부 등)
 * role="switch"로 상태를 제공한다(명세서 §17).
 */
export function ToggleField({
  id,
  value,
  onChange,
  onLabel = "있음",
  offLabel = "없음",
}: {
  id?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
        value
          ? "border-primary bg-primary-soft font-semibold text-primary"
          : "border-border bg-surface text-foreground"
      }`}
    >
      <span>{value ? onLabel : offLabel}</span>
      <span
        aria-hidden
        className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
          value ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
