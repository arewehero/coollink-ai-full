/**
 * 앱 부트스트랩 흐름
 *
 * 익명 사용자 생성은 더 이상 사용하지 않는다.
 * Google OAuth 로그인 세션을 확인한 뒤, 실제 계정 id를 기존 API용
 * X-User-Id 저장소에 동기화하고 프로필 상태에 따라 이동한다.
 */
import { api } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/storage/auth";
import { isUserProfileComplete } from "@/lib/auth/profileCompletion";
import { clearStoredUserId, setStoredUserId } from "@/lib/storage/user";
import type { AuthenticatedUser } from "@/types/api";

export type BootstrapDestination = "/onboarding" | "/today";

export type BootstrapResult = {
  destination: BootstrapDestination;
  /** 더 이상 익명 사용자 재생성을 하지 않으므로 항상 false */
  wasUserReset: boolean;
};

function getAuthenticatedUserId(user: AuthenticatedUser): string | null {
  const id = user.user_id ?? user.id;
  return id === undefined || id === null ? null : String(id);
}

function resolveDestination(user: AuthenticatedUser): BootstrapDestination {
  return isUserProfileComplete(user) ? "/today" : "/onboarding";
}

export async function bootstrapApp(
  signal?: AbortSignal,
): Promise<BootstrapResult> {
  if (!getAccessToken()) {
    clearStoredUserId();
    throw new Error("AUTH_REQUIRED");
  }

  try {
    const user = await api.getAuthenticatedMe(signal);
    const userId = getAuthenticatedUserId(user);
    if (!userId) throw new Error("AUTH_USER_ID_MISSING");
    setStoredUserId(userId);
    const destination = resolveDestination(user);
    return {
      destination,
      wasUserReset: false,
    };
  } catch {
    clearAccessToken();
    clearStoredUserId();
    throw new Error("AUTH_SESSION_EXPIRED");
  }
}
