"use client";

/**
 * OnboardingLayout — 단계 공통 레이아웃 (명세서 §10.2)
 *
 * 상단: 진행률 + 단계 제목/설명
 * 본문: 단계 입력 필드
 * 하단: 이전/다음(또는 완료) 버튼 + 단계/제출 오류 안내
 */
import { OnboardingStepper } from "./OnboardingStepper";
import { FormHelperText } from "@/components/form/FormHelperText";

export function OnboardingLayout({
  step,
  total,
  title,
  description,
  children,
  stepError,
  submitError,
  submitting = false,
  canGoPrev,
  isLast,
  nextLabel,
  nextDisabled = false,
  onExitToSplash,
  onPrev,
  onNext,
}: {
  step: number;
  total: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  stepError?: string | null;
  submitError?: string | null;
  submitting?: boolean;
  canGoPrev: boolean;
  isLast: boolean;
  nextLabel: string;
  nextDisabled?: boolean;
  onExitToSplash?: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col gap-4 border-b border-border bg-surface px-5 py-5">
        {onExitToSplash ? (
          <button
            type="button"
            onClick={onExitToSplash}
            aria-label="스플래시 화면으로 돌아가기"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-neutral transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
          >
            <span aria-hidden className="text-base leading-none">
              ←
            </span>
            <span>처음으로</span>
          </button>
        ) : null}
        <OnboardingStepper step={step} total={total} />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description ? (
            <p className="text-sm leading-6 text-neutral">{description}</p>
          ) : null}
        </div>
      </header>

      <div className="flex-1 px-5 py-6">{children}</div>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-surface px-5 py-4">
        {stepError ? (
          <FormHelperText variant="error">{stepError}</FormHelperText>
        ) : null}
        {submitError ? (
          <FormHelperText variant="error">{submitError}</FormHelperText>
        ) : null}
        <div className="flex gap-2">
          {canGoPrev ? (
            <button
              type="button"
              onClick={onPrev}
              disabled={submitting}
              className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              이전
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNext}
            disabled={submitting || nextDisabled}
            aria-busy={submitting}
            className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {submitting && isLast ? "저장 중…" : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
