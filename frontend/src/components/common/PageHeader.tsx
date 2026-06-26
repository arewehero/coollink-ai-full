/**
 * PageHeader — 페이지 제목/뒤로가기 (명세서 §11.1)
 */
export function PageHeader({
  title,
  subtitle,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-neutral">{subtitle}</p>
        ) : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
