"use client";

/**
 * BootstrapScreen — `/` 앱 첫 진입 Splash/Intro 화면 (명세서 §10.1)
 *
 * - 중앙: CoolLink AI 로고 + 소개 문구 + 핵심 가치
 * - 로그인 전: Google 회원가입/로그인 버튼
 * - 로그인 후: 계정 카드 + "오늘의 절약 루틴 시작하기" 버튼
 * - 로딩: "오늘의 절약 루틴을 준비하고 있어요" + 스피너
 * - 실패: 재시도 버튼
 */
import { useBootstrap } from "@/hooks/useBootstrap";
import { useAuth } from "@/hooks/useAuth";
import type { AuthenticatedUser } from "@/types/api";

function Logo() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-primary to-[#0f8a3e] text-3xl font-extrabold tracking-tight text-white shadow-lg shadow-primary/30">
      CL
    </div>
  );
}

const VALUES: { icon: React.ReactNode; title: string; desc: string }[] = [
  {
    title: "전기요금 절약",
    desc: "오늘 아낄 수 있는 금액을 한눈에",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "탄소중립 실천",
    desc: "행동마다 CO₂ 감축 효과까지",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M5 19c-1-8 5-13 14-13 0 9-5 15-14 13Z"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <path d="M9 15c2-3 4-4 7-5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "시간대별 맞춤",
    desc: "아침·한낮·저녁 행동 추천",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={1.6} />
        <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function getDisplayName(user: AuthenticatedUser): string {
  return user.name?.trim() || user.email?.split("@")[0] || "사용자";
}

function getProfileImage(user: AuthenticatedUser): string | null {
  return (
    user.profileImage ||
    user.profile_image ||
    user.picture_url ||
    user.avatar_url ||
    null
  );
}

function GoogleIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-sm font-black text-primary">
      G
    </span>
  );
}

function AccountCard({ user }: { user: AuthenticatedUser }) {
  const image = getProfileImage(user);
  const name = getDisplayName(user);

  return (
    <section className="mt-5 flex w-full max-w-[19rem] items-center gap-3 rounded-2xl border border-primary/20 bg-surface/85 p-3 text-left shadow-sm backdrop-blur">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-extrabold text-primary">
          {name.slice(0, 1)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-foreground">
          안녕하세요, {name}님
        </span>
        {user.email ? (
          <span className="mt-0.5 block truncate text-xs text-neutral">
            {user.email}
          </span>
        ) : null}
      </span>
    </section>
  );
}

export function BootstrapScreen() {
  const { status, start } = useBootstrap();
  const auth = useAuth();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* 장식 배경 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-soft via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 top-44 h-44 w-44 rounded-full bg-success/10 blur-3xl"
      />

      <div className="relative flex flex-1 flex-col px-6 pb-10 pt-16">
        {/* 브랜드 + 소개 */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Logo />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            CoolLink AI
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-primary">
            탄소중립 · 전기요금 절약 코치
          </p>
          <p className="mt-5 max-w-[17rem] text-[15px] leading-7 text-neutral">
            오늘 날씨와 생활패턴에 맞춘 절약 루틴을 AI가 시간대별로 짜드려요.
          </p>

          <ul className="mt-9 flex w-full max-w-[19rem] flex-col gap-3 rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur">
            {VALUES.map((v) => (
              <li key={v.title} className="flex items-center gap-3 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  {v.icon}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {v.title}
                  </span>
                  <span className="text-xs text-neutral">{v.desc}</span>
                </span>
              </li>
            ))}
          </ul>

          {auth.isAuthenticated && auth.user ? (
            <AccountCard user={auth.user} />
          ) : null}
        </div>

        {/* 하단: CTA / 로딩 / 오류 */}
        <div className="mt-8">
          {auth.status === "checking" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-3 py-2"
            >
              <span
                aria-hidden
                className="h-7 w-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
              />
              <p className="text-sm text-neutral">로그인 상태 확인 중...</p>
            </div>
          ) : status === "error" ? (
            <div role="alert" className="flex flex-col items-center gap-3">
              <p className="text-center text-sm leading-6 text-neutral">
                앱을 시작하지 못했어요.
                <br />
                잠시 후 다시 시도해주세요.
              </p>
              <button
                type="button"
                onClick={start}
                className="w-full rounded-full bg-primary py-4 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:opacity-90"
              >
                다시 시도
              </button>
            </div>
          ) : status === "loading" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-3 py-2"
            >
              <span
                aria-hidden
                className="h-7 w-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
              />
              <p className="text-sm text-neutral">
                오늘의 절약 루틴을 준비하고 있어요
              </p>
            </div>
          ) : auth.isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={start}
                className="w-full rounded-full bg-primary py-4 text-base font-bold text-white shadow-md shadow-primary/25 transition-colors hover:opacity-90 active:scale-[0.99]"
              >
                오늘의 절약 루틴 시작하기
              </button>
              <p className="mt-3 text-center text-xs text-neutral">
                3분이면 오늘의 절약 루틴이 완성돼요.
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={auth.loginWithGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white py-4 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-primary-soft/30 active:scale-[0.99]"
              >
                <GoogleIcon />
                Google로 회원가입
              </button>
              <button
                type="button"
                onClick={auth.loginWithGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/20 bg-surface py-4 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary-soft active:scale-[0.99]"
              >
                <GoogleIcon />
                Google로 로그인
              </button>
              <p className="mt-1 text-center text-xs text-neutral">
                Google 계정으로 절약 루틴을 이어갈 수 있어요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
