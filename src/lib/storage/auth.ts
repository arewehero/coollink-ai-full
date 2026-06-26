/**
 * Google OAuth access token storage.
 *
 * 기존 익명 사용자 ID(`coollink_user_id`)와 분리해 로그인 세션만 관리한다.
 */
export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } catch {
    /* localStorage 접근 불가 — 저장 생략 */
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    /* localStorage 접근 불가 — 삭제 생략 */
  }
}
