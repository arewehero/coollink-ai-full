import { BootstrapScreen } from "@/features/bootstrap/BootstrapScreen";

/**
 * `/` 부트스트랩 화면 (명세서 §10.1)
 *
 * user_id 확인 → 익명 사용자 생성 → /users/me 조회 →
 * has_profile 값에 따라 /onboarding 또는 /today로 분기한다.
 * 실제 흐름은 BootstrapScreen + useBootstrap에서 처리한다.
 */
export default function BootstrapPage() {
  return <BootstrapScreen />;
}
