"use client";

/**
 * WeatherSummaryCard — 오늘 날씨 요약 (명세서 §10.9)
 *
 * GET /weather/hourly의 time_blocks에서 최고 기온/체감/습도를 계산해 표시하고,
 * heat_alert 또는 체감 35°C 이상이면 폭염 배너를 함께 보여준다.
 */
import Link from "next/link";
import type { HourlyWeatherResponse } from "@/types/api";
import type { WeatherStatus } from "@/features/today/useToday";
import { HeatAlertBanner } from "./HeatAlertBanner";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-neutral">{label}</span>
      <span className="text-base font-bold text-foreground">{value}</span>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      {children}
    </section>
  );
}

export function WeatherSummaryCard({
  status,
  weather,
}: {
  status: WeatherStatus;
  weather: HourlyWeatherResponse | null;
}) {
  if (status === "no-location") {
    return (
      <CardShell>
        <p className="text-sm text-neutral">
          위치를 설정하면 오늘 날씨를 함께 보여드려요.
        </p>
        <Link
          href="/location"
          className="mt-2 inline-block text-sm font-semibold text-primary"
        >
          위치 설정하기
        </Link>
      </CardShell>
    );
  }

  if (status === "loading") {
    return (
      <CardShell>
        <div className="h-4 w-1/3 animate-pulse rounded bg-border" />
        <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-border" />
      </CardShell>
    );
  }

  if (status === "error" || !weather || weather.time_blocks.length === 0) {
    return (
      <CardShell>
        <p className="text-sm text-neutral">
          오늘 날씨를 불러오지 못했어요. 잠시 후 새로고침해주세요.
        </p>
      </CardShell>
    );
  }

  const blocks = weather.time_blocks;
  const maxTemp = Math.max(...blocks.map((b) => b.temperature));
  const hottest = blocks.reduce((a, b) => (b.feels_like > a.feels_like ? b : a));
  const heat = blocks.some((b) => b.heat_alert) || hottest.feels_like >= 35;

  return (
    <div className="flex flex-col gap-3">
      {heat ? <HeatAlertBanner /> : null}
      <CardShell>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            오늘 날씨
          </span>
          <span className="text-xs text-neutral">
            {weather.location?.region_name
              ? `${weather.location.region_name} 기준`
              : "최근 날씨 기준"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="최고 기온" value={`${Math.round(maxTemp)}°C`} />
          <Stat label="최고 체감온도" value={`${Math.round(hottest.feels_like)}°C`} />
          <Stat label="습도" value={`${Math.round(hottest.humidity)}%`} />
        </div>
        {/* 시간대별 날씨 (새벽~밤) */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {blocks.map((b) => (
            <div
              key={b.time_range}
              className="flex min-w-[58px] flex-col items-center gap-0.5 rounded-xl border border-border px-2 py-2"
            >
              <span className="text-xs text-neutral">{b.time_range}</span>
              <span className="text-sm font-bold text-foreground">
                {Math.round(b.temperature)}°
              </span>
              <span className="text-[10px] text-neutral">
                체감 {Math.round(b.feels_like)}°
              </span>
              <span className="text-[10px] text-neutral">
                습도 {Math.round(b.humidity)}%
              </span>
              {b.rain ? (
                <span className="text-[10px] font-semibold text-primary">비</span>
              ) : null}
            </div>
          ))}
        </div>
      </CardShell>
    </div>
  );
}
