/**
 * 위치 정보 저장 (명세서 §6.1, §13.1, §19)
 *
 * `coollink_location`에 GPS 좌표 또는 선택 지역을 저장한다.
 * 정확한 주소는 저장하지 않고 날씨 조회용 좌표/지역만 보관한다(명세서 §19).
 */
import type { LocationState } from "@/types/api";

const LOCATION_STORAGE_KEY = "coollink_location";

export function getStoredLocation(): LocationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocationState) : null;
  } catch {
    /* 파싱 실패/접근 불가 — 위치 없음으로 취급 */
    return null;
  }
}

export function setStoredLocation(location: LocationState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(location),
    );
  } catch {
    /* 접근 불가 — 저장 생략 */
  }
}

export function clearStoredLocation(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch {
    /* 접근 불가 — 삭제 생략 */
  }
}
