/**
 * 날짜 포맷 (명세서 §20.5)
 *
 * 모든 날짜는 Asia/Seoul 기준, API 전달 시 YYYY-MM-DD 형태를 사용한다.
 */

/** 오늘 날짜를 Asia/Seoul 기준 YYYY-MM-DD로 반환 */
export function getTodayKst(): string {
  // en-CA 로케일은 YYYY-MM-DD 형식을 보장한다.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 오늘 날짜를 한국어 라벨로 반환 (예: "6월 26일 (금)") */
export function getTodayLabelKst(): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}
