"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/storage/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("access_token");
  const error = searchParams.get("error");
  const debug = searchParams.get("debug") === "1";
  const message = token
    ? "로그인 토큰 저장 완료"
    : error
      ? `로그인 실패: ${error}`
      : "로그인 토큰이 없습니다.";

  useEffect(() => {
    if (token) {
      setAccessToken(token);
      if (!debug) {
        const timer = setTimeout(() => router.replace("/"), 500);
        return () => clearTimeout(timer);
      }
      return;
    }
    // 토큰 없음(로그인 실패/에러 포함) → 잠시 후 홈으로 복귀
    if (!debug) {
      const timer = setTimeout(() => router.replace("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [debug, error, router, token]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: 600,
      }}
    >
      {message}
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main>로그인 처리 중...</main>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
