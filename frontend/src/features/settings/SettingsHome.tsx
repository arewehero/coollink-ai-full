"use client";

/**
 * SettingsHome — 설정 홈 (명세서 §10.15)
 * 프로필/위치/계산 기준 진입.
 */
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";

const MENU = [
  {
    href: "/settings/profile?section=home",
    label: "내 집 정보 수정",
    desc: "집 환경 수정",
  },
  {
    href: "/settings/profile?section=lifestyle",
    label: "생활패턴 수정",
    desc: "생활패턴 수정",
  },
  {
    href: "/settings/profile?section=energy",
    label: "냉난방·전기요금 수정",
    desc: "월 전기요금/에어컨 정보 수정",
  },
  { href: "/location", label: "위치 설정", desc: "GPS/지역 변경" },
  {
    href: "/simulator",
    label: "요금 시뮬레이션",
    desc: "온도·시간별 예상 절약액 계산",
  },
  {
    href: "/settings/assumptions",
    label: "계산 기준 보기",
    desc: "CO₂ 계수, 단가 안내",
  },
];

export function SettingsHome() {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();

  return (
    <>
      <PageHeader title="설정" subtitle="프로필 · 계산 기준" />
      <section className="flex flex-1 flex-col gap-3 px-5 py-6">
        {/* 로그인 / 로그아웃 (codex 통합: Google OAuth) */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {user?.name || user?.email || "로그인됨"}
                </span>
                {user?.email ? (
                  <span className="text-xs text-neutral">{user.email}</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={logout}
                className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-neutral"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-white"
            >
              Google로 로그인
            </button>
          )}
        </div>

        <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
          {MENU.map((item) => (
            <li key={item.href} className="border-b border-border last:border-b-0">
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 px-4 py-4"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="text-xs text-neutral">{item.desc}</span>
                </span>
                <span aria-hidden className="text-neutral">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>

      </section>
    </>
  );
}
