"use client";

/**
 * ChipGroup — 선택형 단일 선택 UI (명세서 §11.2)
 *
 * variant로 칩/카드/방향(컴퍼스) 레이아웃을 공용 처리한다.
 * 색상만으로 상태를 구분하지 않도록 선택 시 테두리/굵기/체크 텍스트를 함께 쓴다(명세서 §17).
 */
export type ChipVariant = "chip" | "card" | "compass";

export function ChipGroup({
  options,
  value,
  onChange,
  variant = "chip",
  ariaLabel,
  invalid = false,
}: {
  options: readonly string[];
  value?: string | null;
  onChange: (value: string) => void;
  variant?: ChipVariant;
  ariaLabel?: string;
  invalid?: boolean;
}) {
  const container =
    variant === "card"
      ? "flex flex-col gap-2"
      : variant === "compass"
        ? "grid grid-cols-4 gap-2"
        : "flex flex-wrap gap-2";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={container}
    >
      {options.map((option) => {
        const selected = value === option;
        const base =
          variant === "card"
            ? "w-full rounded-xl border px-4 py-3 text-left text-sm"
            : "rounded-full border px-4 py-2 text-sm";
        const state = selected
          ? "border-primary bg-primary-soft font-semibold text-primary"
          : "border-border bg-surface text-foreground";

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`${base} ${state} transition-colors`}
          >
            {variant === "card" ? (
              <span className="flex items-center justify-between gap-2">
                <span>{option}</span>
                {selected ? <span aria-hidden>✓</span> : null}
              </span>
            ) : (
              option
            )}
          </button>
        );
      })}
    </div>
  );
}
