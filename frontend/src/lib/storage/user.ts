/**
 * 사용자 식별자 저장 (명세서 §6.1, §6.3)
 *
 * `coollink_user_id`는 익명 사용자 ID로, 민감정보로 취급한다(명세서 §19).
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
