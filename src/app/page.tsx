import { BootstrapScreen } from "@/features/bootstrap/BootstrapScreen";

/**
 * `/` 부트스트랩 화면
 *
 * Google 로그인 세션 확인 → 실제 계정 id 동기화 →
 * has_profile 값에 따라 /onboarding 또는 /today로 분기한다.
 * 실제 흐름은 BootstrapScreen + useBootstrap에서 처리한다.
 */
export default function BootstrapPage() {
  return <BootstrapScreen />;
}
