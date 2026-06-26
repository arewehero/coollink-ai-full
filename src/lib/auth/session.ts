import { api } from "@/lib/api";
import { clearAccessToken } from "@/lib/storage/auth";
import type { AuthenticatedUser } from "@/types/api";

export function getGoogleLoginUrl(): string {
  return api.getGoogleOAuthLoginUrl();
}

export function loginWithGoogle(): void {
  if (typeof window === "undefined") return;
  window.location.href = getGoogleLoginUrl();
}

export function logout(): void {
  clearAccessToken();
}

export function getMe(signal?: AbortSignal): Promise<AuthenticatedUser> {
  return api.getAuthenticatedMe(signal);
}
