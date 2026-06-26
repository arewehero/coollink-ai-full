import { api } from "@/lib/api";
import { clearAccessToken, setAccessToken } from "@/lib/storage/auth";
import { clearStoredUserId, setStoredUserId } from "@/lib/storage/user";
import type { AuthenticatedUser } from "@/types/api";

const MOCK_USER_ID = "mock-user-0001";
const MOCK_ACCESS_TOKEN = "mock-access-token";
const MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";

export function getGoogleLoginUrl(): string {
  return api.getGoogleOAuthLoginUrl();
}

export function loginWithGoogle(): void {
  if (typeof window === "undefined") return;
  if (MOCK_ENABLED) {
    setAccessToken(MOCK_ACCESS_TOKEN);
    setStoredUserId(MOCK_USER_ID);
    window.location.href = "/";
    return;
  }
  window.location.href = getGoogleLoginUrl();
}

export function logout(): void {
  clearAccessToken();
  clearStoredUserId();
}

export function getMe(signal?: AbortSignal): Promise<AuthenticatedUser> {
  return api.getAuthenticatedMe(signal);
}
