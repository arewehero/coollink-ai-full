/**
 * 온보딩 임시 저장 (명세서 §6.1, §10.2)
 *
 * `coollink_onboarding_draft`에 입력값 스냅샷을 저장해 재진입 시 복원한다.
 * 프로필 저장(PUT /profile) 성공 후 clear 한다.
 */
const ONBOARDING_DRAFT_KEY = "coollink_onboarding_draft";

export function loadOnboardingDraft<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    /* 파싱 실패/접근 불가 — 초안 없음으로 취급 */
    return null;
  }
}

export function saveOnboardingDraft(values: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(values));
  } catch {
    /* 접근 불가/용량 초과 — 저장 생략 */
  }
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    /* 접근 불가 — 삭제 생략 */
  }
}
