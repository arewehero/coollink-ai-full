"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isUserProfileComplete } from "@/lib/auth/profileCompletion";
import { BottomNav } from "./BottomNav";
import { ToastProvider } from "./ToastProvider";

/**
 * AppShell — 공통 레이아웃 (명세서 §11.1)
 *
 * - 모바일 우선 단일 컬럼, 데스크톱에서는 중앙 정렬 (명세서 §16.3)
 * - 하단 탭은 `오늘 / 리포트 / 설정` 3개만 노출 (명세서 §5)
 * - 부트스트랩(/), OAuth callback, 온보딩(/onboarding), 위치 설정(/location)에서는 하단 탭을 숨긴다.
 * - 공개 라우트 외 화면은 Google 로그인 세션이 있어야 렌더링한다.
 */
const HIDE_BOTTOM_NAV_ROUTES = ["/", "/auth/callback", "/onboarding", "/location"];
const PUBLIC_ROUTES = ["/", "/auth/callback"];
const PROFILE_SETUP_ROUTES = ["/onboarding", "/location"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

function isProfileSetupRoute(pathname: string): boolean {
  return PROFILE_SETUP_ROUTES.some((route) => pathname === route);
}

export function AppShell({
  children,
  showBottomNav,
}: {
  children: React.ReactNode;
  /** 명시하지 않으면 현재 경로로 자동 판단한다. */
  showBottomNav?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const autoVisible = !HIDE_BOTTOM_NAV_ROUTES.includes(pathname);
  const navVisible = showBottomNav ?? autoVisible;
  const publicRoute = isPublicRoute(pathname);
  const profileSetupRoute = isProfileSetupRoute(pathname);
  const shouldGuard = !publicRoute;
  const blockedByProfileSetup =
    shouldGuard &&
    !profileSetupRoute &&
    auth.status === "authenticated" &&
    !isUserProfileComplete(auth.user);

  useEffect(() => {
    if (!shouldGuard) return;
    if (auth.status === "unauthenticated") router.replace("/");
    if (blockedByProfileSetup) router.replace("/onboarding");
  }, [auth.status, blockedByProfileSetup, router, shouldGuard]);

  const content =
    shouldGuard && (auth.status !== "authenticated" || blockedByProfileSetup) ? (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <span
          aria-hidden
          className="h-7 w-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
        />
        <p className="text-sm text-neutral">로그인 상태를 확인하고 있어요</p>
      </div>
    ) : (
      children
    );

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background">
        <main className={`flex flex-1 flex-col ${navVisible ? "pb-20" : ""}`}>
          {content}
        </main>
        {navVisible && (!shouldGuard || auth.status === "authenticated") ? (
          <BottomNav />
        ) : null}
      </div>
    </ToastProvider>
  );
}
