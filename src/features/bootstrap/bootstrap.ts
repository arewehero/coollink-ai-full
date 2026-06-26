/**
 * 앱 부트스트랩 흐름 (명세서 §4.1, §6.2)
 *
 * 1. localStorage에서 coollink_user_id 확인
 * 2. 없으면 POST /users/anonymous 호출 후 저장
 * 3. GET /users/me 호출
 * 4. has_profile=false → /onboarding, true → /today
 *
 * Google OAuth 토큰이 있으면 익명 사용자 생성 전에 /user/me로 세션을 확인하고,
 * 확인 실패 시 토큰을 제거한 뒤 로그인 전 상태로 돌아갈 수 있도록 실패시킨다.
 *
 * 추가로 §6.3·§14.1에 따라 user_id가 만료(USER_NOT_FOUND)된 경우
 * 한 번 재생성 후 재시도한다.
 */
import { api, isApiErrorCode } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/storage/auth";
import {
  clearStoredUserId,
  getStoredUserId,
  setStoredUserId,
} from "@/lib/storage/user";

export type BootstrapDestination = "/onboarding" | "/today";

export type BootstrapResult = {
  destination: BootstrapDestination;
  /** user_id 만료로 사용자를 새로 만들었는지 (기존 데이터 유실 안내용, 명세서 §6.3) */
  wasUserReset: boolean;
};

/** 클라이언트 타임존 (실패 시 Asia/Seoul, 명세서 §20.5) */
function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
  } catch {
    return "Asia/Seoul";
  }
}

async function createAndStoreUser(signal?: AbortSignal): Promise<string> {
  const created = await api.createAnonymousUser(
    { client_timezone: getClientTimezone() },
    signal,
  );
  setStoredUserId(created.user_id);
  return created.user_id;
}

/** user_id를 확보한다. 없으면 익명 사용자를 생성·저장한다. (명세서 §6.2) */
async function ensureUserId(signal?: AbortSignal): Promise<void> {
  if (getStoredUserId()) return;
  await createAndStoreUser(signal);
}

export async function bootstrapApp(
  signal?: AbortSignal,
): Promise<BootstrapResult> {
  if (getAccessToken()) {
    try {
      const user = await api.getAuthenticatedMe(signal);
      return {
        destination: user.has_profile === false ? "/onboarding" : "/today",
        wasUserReset: false,
      };
    } catch {
      clearAccessToken();
      throw new Error("AUTH_SESSION_EXPIRED");
    }
  }

  await ensureUserId(signal);

  let wasUserReset = false;
  let me;
  try {
    me = await api.getMe(signal);
  } catch (error) {
    // user_id 만료/삭제 → 재생성 후 1회 재시도 (명세서 §6.3, §14.1)
    if (!isApiErrorCode(error, "USER_NOT_FOUND")) throw error;
    clearStoredUserId();
    await createAndStoreUser(signal);
    me = await api.getMe(signal);
    wasUserReset = true;
  }

  return {
    destination: me.has_profile ? "/today" : "/onboarding",
    wasUserReset,
  };
}
