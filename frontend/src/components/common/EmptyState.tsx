/**
 * EmptyState — 빈 상태 (명세서 §11.1)
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon ? <div className="text-neutral">{icon}</div> : null}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {message ? (
        <p className="max-w-xs text-sm leading-6 text-neutral">{message}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
