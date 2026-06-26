/**
 * API 호환용 사용자 식별자 저장소.
 *
 * 과거 키 이름은 유지하지만, 값은 Google OAuth 로그인 후 받은 실제 계정 id다.
 * 기존 백엔드 API 중 X-User-Id를 요구하는 엔드포인트와 연결하기 위해 사용한다.
 * SSR/시크릿 모드 등 localStorage 접근 불가 상황에서도 throw 하지 않는다.
 */
export const USER_ID_STORAGE_KEY = "coollink_user_id";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(USER_ID_STORAGE_KEY);
  } catch {
    /* localStorage 접근 불가 — null 취급 */
    return null;
  }
}

export function setStoredUserId(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  } catch {
    /* localStorage 접근 불가 — 저장 생략 */
  }
}

export function clearStoredUserId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
  } catch {
    /* localStorage 접근 불가 — 삭제 생략 */
  }
}
