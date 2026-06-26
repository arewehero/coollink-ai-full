/**
 * SkeletonCard — 카드 로딩 자리표시 (명세서 §11.1, §18)
 */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="불러오는 중"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
    >
      <div className="h-4 w-1/3 animate-pulse rounded bg-border" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-border"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}
