"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/storage/auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      router.replace("/");
      return;
    }

    setAccessToken(token);
    router.replace("/");
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <section className="w-full max-w-[360px] rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <span
          aria-hidden
          className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
        />
        <h1 className="mt-4 text-lg font-bold text-foreground">
          로그인 정보를 저장하고 있어요
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral">
          잠시 후 CoolLink AI로 돌아갑니다.
        </p>
      </section>
    </main>
  );
}
