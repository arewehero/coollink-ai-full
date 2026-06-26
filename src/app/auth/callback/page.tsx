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
    console.log("auth callback full url", window.location.href);
    console.log("auth callback token", token);
    console.log("auth callback error", error);
    console.log("auth callback debug", debug);

    if (token) {
      setAccessToken(token);
      console.log("saved accessToken", localStorage.getItem("accessToken"));

      if (!debug) {
        setTimeout(() => {
          router.replace("/");
        }, 500);
      }

      return;
    }

    if (error) {
      console.error("auth callback error", error);

      if (!debug) {
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      }

      return;
    }

    console.warn("auth callback: no token");

    if (!debug) {
      setTimeout(() => {
        router.replace("/");
      }, 1500);
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
