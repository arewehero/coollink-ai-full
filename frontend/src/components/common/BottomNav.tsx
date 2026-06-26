"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * BottomNav — 하단 탭 (명세서 §5, §11.1)
 *
 * 탭: `오늘 / 리포트 / 뽑기 / 설정`.
 * 관리자·취약계층·건강정보·SMS/카카오 관련 탭은 만들지 않는다.
 */
type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/today",
    label: "오늘",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <path
          d="M12 3.5 4 9.5V20a.5.5 0 0 0 .5.5H9V14h6v6.5h4.5a.5.5 0 0 0 .5-.5V9.5L12 3.5Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
      </svg>
    ),
  },
  {
    href: "/report",
    label: "리포트",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <path
          d="M5 20V11M12 20V4M19 20v-6"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 1.8}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/gacha",
    label: "뽑기",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <rect
          x="4"
          y="9"
          width="16"
          height="11.5"
          rx="1"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <rect
          x="3"
          y="6.5"
          width="18"
          height="3.5"
          rx="0.8"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
        />
        <path d="M12 6.5v14" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <path
          d="M12 6.5c-1-2.6-2.6-3.6-3.7-2.8-1 .7-.3 2.8 3.7 2.8Zm0 0c1-2.6 2.6-3.6 3.7-2.8 1 .7.3 2.8-3.7 2.8Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "설정",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
        />
        <path
          d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L16 3H8l-.5 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 3 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L8 21h8l.5-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.2-.8.2-1.2Z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.4}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-surface"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                  active ? "text-primary" : "text-neutral"
                }`}
              >
                {tab.icon(active)}
                <span className={active ? "font-semibold" : "font-medium"}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
