"use client";

/**
 * SettingsHome — 설정 홈 (명세서 §10.15)
 * 프로필/위치/계산 기준 진입 + 데이터 초기화(확인 모달).
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { clearAccessToken } from "@/lib/storage/auth";
import { clearStoredUserId } from "@/lib/storage/user";
import { clearStoredLocation } from "@/lib/storage/location";
import { clearOnboardingDraft } from "@/lib/storage/onboardingDraft";

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

function resetAllData() {
  clearAccessToken();
  clearStoredUserId();
  clearStoredLocation();
  clearOnboardingDraft();
  try {
    window.localStorage.removeItem("coollink_mock_profile");
    window.localStorage.removeItem("coollink_seen_intro");
  } catch {
    /* 접근 불가 — 무시 */
  }
}

export function SettingsHome() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReset = () => {
    resetAllData();
    setConfirmOpen(false);
    router.replace("/");
  };

  return (
    <>
      <PageHeader title="설정" subtitle="프로필 · 계산 기준 · 초기화" />
      <section className="flex flex-1 flex-col gap-3 px-5 py-6">
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

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-2 rounded-2xl border border-border bg-surface px-4 py-4 text-left text-sm font-semibold text-danger"
        >
          데이터 초기화
        </button>
      </section>

      <ConfirmModal
        open={confirmOpen}
        title="데이터를 초기화할까요?"
        message="이 기기의 로그인 세션과 프로필 임시 저장값이 삭제돼요. 뽑기권과 컬렉션은 유지됩니다."
        confirmLabel="초기화"
        danger
        onConfirm={handleReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
