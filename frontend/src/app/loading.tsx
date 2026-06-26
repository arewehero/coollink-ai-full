/**
 * 공통 로딩 화면 (명세서 §11.1 LoadingScreen, §18 skeleton 우선)
 */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
      />
      <p role="status" className="text-sm text-neutral">
        불러오는 중이에요…
      </p>
    </div>
  );
}
