import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/common/AppShell";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "CoolLink AI",
  description:
    "생활패턴·날씨·집 환경 기반 오늘의 탄소중립 절약 루틴을 추천하는 사용자 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
