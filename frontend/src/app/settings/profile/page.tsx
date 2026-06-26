import { Suspense } from "react";
import { ProfileEditFlow } from "@/features/settings/ProfileEditFlow";

/** `/settings/profile` 프로필 수정 (명세서 §4.4, §10.15) — 프로필 완료 시 진입 */
export default function SettingsProfilePage() {
  // useSearchParams(section) 사용 → Suspense 경계 필요
  return (
    <Suspense fallback={null}>
      <ProfileEditFlow />
    </Suspense>
  );
}
