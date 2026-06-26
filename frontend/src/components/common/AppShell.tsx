"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { ToastProvider } from "./ToastProvider";

/**
 * AppShell — 공통 레이아웃 (명세서 §11.1)
 *
 * - 모바일 우선 단일 컬럼, 데스크톱에서는 중앙 정렬 (명세서 §16.3)
 * - 하단 탭은 `오늘 / 리포트 / 설정` 3개만 노출 (명세서 §5)
 * - 부트스트랩(/), 온보딩(/onboarding), 위치 설정(/location)에서는 하단 탭을 숨긴다.
 */
const HIDE_BOTTOM_NAV_ROUTES = ["/", "/onboarding", "/location"];

export function AppShell({
  children,
  showBottomNav,
}: {
  children: React.ReactNode;
  /** 명시하지 않으면 현재 경로로 자동 판단한다. */
  showBottomNav?: boolean;
}) {
  const pathname = usePathname();
  const autoVisible = !HIDE_BOTTOM_NAV_ROUTES.includes(pathname);
  const navVisible = showBottomNav ?? autoVisible;

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background">
        <main className={`flex flex-1 flex-col ${navVisible ? "pb-20" : ""}`}>
          {children}
        </main>
        {navVisible ? <BottomNav /> : null}
      </div>
    </ToastProvider>
  );
}
