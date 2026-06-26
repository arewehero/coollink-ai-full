import type { AuthenticatedUser } from "@/types/api";

export function isUserProfileComplete(
  user: AuthenticatedUser | null | undefined,
): boolean {
  if (!user) return false;
  return Boolean(
    user.profileCompleted ?? user.profile_completed ?? user.has_profile,
  );
}
