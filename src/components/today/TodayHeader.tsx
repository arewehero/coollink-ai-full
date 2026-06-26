"use client";

/**
 * TodayHeader — 오늘 날짜 / 지역 / 새로고침 (명세서 §10.7, §11.3)
 */
export function TodayHeader({
  dateLabel,
  regionName,
  onRefresh,
  onLogout,
  refreshing = false,
}: {
  dateLabel: string;
  regionName: string;
  onRefresh?: () => void;
  onLogout?: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-foreground">
          {dateLabel}
        </h1>
        <p className="mt-0.5 truncate text-sm text-neutral">
          {regionName} 기준
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-neutral transition-colors hover:text-primary"
          >
            로그아웃
          </button>
        ) : null}
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="새로고침"
            className="rounded-full border border-border p-2 text-neutral disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            >
              <path
                d="M20 11a8 8 0 1 0-.6 4M20 5v6h-6"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  );
}
