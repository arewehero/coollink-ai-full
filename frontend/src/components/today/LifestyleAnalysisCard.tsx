/**
 * LifestyleAnalysisCard — AI 생활 유형 분석 (명세서 §10.10)
 */
import type { LifestyleAnalysis } from "@/types/api";

/** 신뢰도 표시 규칙 (명세서 §10.10) */
function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "분석 신뢰도 높음";
  if (confidence >= 0.6) return "분석 신뢰도 보통";
  return "입력값이 조금 불규칙해요";
}

export function LifestyleAnalysisCard({
  analysis,
}: {
  analysis: LifestyleAnalysis;
}) {
  const percent = Math.round((analysis.confidence ?? 0) * 100);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          AI 생활 유형 분석
        </span>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
          {confidenceLabel(analysis.confidence)}
        </span>
      </div>

      <p className="mt-3 text-base font-bold text-foreground">
        {analysis.primary_type}
        {analysis.secondary_type ? (
          <span className="font-semibold text-neutral">
            {" "}
            + {analysis.secondary_type}
          </span>
        ) : null}
      </p>

      {analysis.summary ? (
        <p className="mt-2 text-sm leading-6 text-neutral">{analysis.summary}</p>
      ) : null}

      <p className="mt-3 text-xs text-neutral">분석 신뢰도 {percent}%</p>
    </section>
  );
}
