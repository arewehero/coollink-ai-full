/**
 * 금액 표시 (명세서 §16.4, §10.8)
 *
 * 금액에는 "약"을 붙이고 천 단위 구분을 사용한다.
 * "할인/확정/보장" 등 단정 표현은 사용하지 않는다(명세서 §15.2).
 */
function toWon(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value).toLocaleString("ko-KR");
}

/** 예: 1500 → "약 1,500원" */
export function formatKrw(value: number | null | undefined): string {
  const won = toWon(value);
  return won == null ? "약 0원" : `약 ${won}원`;
}

/** 예: 23400 → "월 약 23,400원" */
export function formatKrwMonthly(value: number | null | undefined): string {
  const won = toWon(value);
  return won == null ? "월 약 0원" : `월 약 ${won}원`;
}

/** "약" 없이 표시 (예: 1500 → "1,500원") */
export function formatKrwPlain(value: number | null | undefined): string {
  const won = toWon(value);
  return won == null ? "0원" : `${won}원`;
}
