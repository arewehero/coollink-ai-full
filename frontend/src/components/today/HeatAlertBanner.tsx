/**
 * HeatAlertBanner — 폭염/고온 안내 (명세서 §10.9, §15.3)
 *
 * heat_alert=true 또는 체감온도 35°C 이상일 때 안전 냉방 우선 안내를 표시한다.
 */
export function HeatAlertBanner() {
  return (
    <div
      role="alert"
      className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3"
    >
      <p className="text-sm font-semibold text-foreground">
        오늘은 고온 시간대가 있어요.
      </p>
      <p className="mt-1 text-xs leading-5 text-neutral">
        무리한 절약보다 안전한 냉방을 우선해주세요. 26°C 안팎의 적정 냉방을
        권장해요.
      </p>
    </div>
  );
}
