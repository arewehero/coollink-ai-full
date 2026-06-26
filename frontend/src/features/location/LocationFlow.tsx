"use client";

/**
 * LocationFlow — 위치 설정 + 오늘 플랜 생성 (명세서 §4.2, §10.6, §14.1)
 *
 * 흐름:
 * 1. GPS 권한 요청 → 허용 시 좌표 저장
 * 2. 거부/실패 시 지역 직접 선택
 * 3. 위치를 localStorage 저장 후 POST /recommendations/daily
 * 4. 성공 시 /today 이동, 실패 시 원인별 재시도 UI
 *
 * (PUT /profile은 온보딩 완료 버튼에서 이미 호출되어 이 화면 진입 시 프로필이 존재한다.)
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, isApiError } from "@/lib/api";
import type {
  ApiErrorCode,
  GenerateDailyPlanBody,
  LocationState,
} from "@/types/api";
import { setStoredLocation } from "@/lib/storage/location";
import { getTodayKst } from "@/lib/format/date";
import { ChipGroup } from "@/components/form/ChipGroup";
import { PageHeader } from "@/components/common/PageHeader";

/** 지역 선택 MVP 목록 (명세서 §10.6) */
const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "서울";

type Phase = "choose" | "locating" | "region" | "generating" | "error";

type ErrorInfo = {
  title: string;
  message: string;
  allowReselect: boolean;
};

function requestGpsLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("geolocation-unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  });
}

/** GPS 좌표 → 행정구역명 (BigDataCloud, 키 불필요). 실패 시 undefined. */
async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`,
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      city?: string;
      principalSubdivision?: string;
      locality?: string;
    };
    return data.city || data.principalSubdivision || data.locality || undefined;
  } catch {
    return undefined;
  }
}

/** 에러 코드별 안내 (명세서 §14.1, §14.3) */
function buildErrorInfo(code: ApiErrorCode | undefined, isNetwork: boolean): ErrorInfo {
  if (code === "WEATHER_FETCH_FAILED" || code === "WEATHER_CACHE_MISS") {
    return {
      title: "오늘 날씨를 불러오지 못했어요.",
      message: "지역을 다시 선택하거나 잠시 후 새로고침해주세요.",
      allowReselect: true,
    };
  }
  if (code === "AI_GENERATION_FAILED" || code === "AI_RESPONSE_INVALID") {
    return {
      title: "추천을 만들지 못했어요.",
      message: "AI 분석이 지연되고 있어요. 잠시 후 다시 시도해주세요.",
      allowReselect: false,
    };
  }
  if (code === "RATE_LIMIT_EXCEEDED") {
    return {
      title: "요청이 많아요.",
      message: "잠시 후 다시 시도해주세요.",
      allowReselect: false,
    };
  }
  return {
    title: "오늘의 루틴을 만들지 못했어요.",
    message: isNetwork
      ? "네트워크 연결을 확인하고 다시 시도해주세요."
      : "잠시 후 다시 시도해주세요.",
    allowReselect: true,
  };
}

export function LocationFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("choose");
  const [region, setRegion] = useState<string>(DEFAULT_REGION);
  const [gpsDeniedHint, setGpsDeniedHint] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationState | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  const generatePlan = async (location: LocationState) => {
    setLastLocation(location);
    setStoredLocation(location);
    setErrorInfo(null);
    setPhase("generating");

    const body: GenerateDailyPlanBody = { date: getTodayKst() };
    if (location.type === "gps") {
      body.latitude = location.latitude;
      body.longitude = location.longitude;
    } else {
      body.region_name = location.region_name;
    }

    try {
      await api.generateDailyPlan(body);
      router.replace("/today");
    } catch (error) {
      // 프로필이 없으면(이론상 발생 X) 온보딩으로 되돌린다 (명세서 §14.1)
      if (isApiError(error) && error.code === "PROFILE_NOT_FOUND") {
        router.replace("/onboarding");
        return;
      }
      const code = isApiError(error) ? error.code : undefined;
      const isNetwork = isApiError(error) ? error.isNetworkError : false;
      setErrorInfo(buildErrorInfo(code, isNetwork));
      setPhase("error");
    }
  };

  const handleUseGps = async () => {
    setGpsDeniedHint(false);
    setPhase("locating");
    try {
      const coords = await requestGpsLocation();
      const region_name = await reverseGeocode(coords.latitude, coords.longitude);
      await generatePlan({ type: "gps", ...coords, region_name });
    } catch {
      // 권한 거부/실패 → 지역 직접 선택 (명세서 §10.6)
      setGpsDeniedHint(true);
      setPhase("region");
    }
  };

  const handleConfirmRegion = () => {
    generatePlan({ type: "region", region_name: region });
  };

  const handleRetry = () => {
    if (lastLocation) {
      generatePlan(lastLocation);
    } else {
      setPhase("choose");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="위치 설정" subtitle="오늘 날씨 기준이 될 위치예요" />
      <div className="flex flex-1 flex-col px-5 py-6">
        {phase === "choose" ? (
          <ChooseView onUseGps={handleUseGps} onPickRegion={() => setPhase("region")} />
        ) : null}

        {phase === "locating" ? (
          <LoadingView message="현재 위치를 확인하고 있어요…" />
        ) : null}

        {phase === "region" ? (
          <RegionView
            region={region}
            onRegionChange={setRegion}
            onConfirm={handleConfirmRegion}
            showDeniedHint={gpsDeniedHint}
          />
        ) : null}

        {phase === "generating" ? (
          <LoadingView message="오늘의 절약 루틴을 만들고 있어요…" />
        ) : null}

        {phase === "error" && errorInfo ? (
          <ErrorPhaseView
            info={errorInfo}
            onRetry={handleRetry}
            onReselect={() => setPhase("region")}
          />
        ) : null}
      </div>
    </div>
  );
}

function ChooseView({
  onUseGps,
  onPickRegion,
}: {
  onUseGps: () => void;
  onPickRegion: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="rounded-2xl bg-primary-soft p-5">
        <p className="text-sm font-semibold text-foreground">
          오늘의 기온과 습도를 반영하려면 위치가 필요해요.
        </p>
        <p className="mt-2 text-xs leading-5 text-neutral">
          정확한 주소는 저장하지 않고 날씨 조회에만 사용합니다.
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <button
          type="button"
          onClick={onUseGps}
          className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          현재 위치 사용하기
        </button>
        <button
          type="button"
          onClick={onPickRegion}
          className="rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground"
        >
          지역 직접 선택하기
        </button>
      </div>
    </div>
  );
}

function RegionView({
  region,
  onRegionChange,
  onConfirm,
  showDeniedHint,
}: {
  region: string;
  onRegionChange: (region: string) => void;
  onConfirm: () => void;
  showDeniedHint: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col">
      {showDeniedHint ? (
        <p className="mb-4 rounded-xl bg-primary-soft px-4 py-3 text-sm leading-6 text-foreground">
          괜찮아요. 지역을 직접 선택해도 오늘의 절약 루틴을 만들 수 있어요.
        </p>
      ) : null}

      <span className="mb-3 text-sm font-semibold text-foreground">
        지역 선택
      </span>
      <ChipGroup
        options={REGIONS}
        value={region}
        onChange={onRegionChange}
        ariaLabel="지역 선택"
      />

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          이 지역으로 만들기
        </button>
      </div>
    </div>
  );
}

function LoadingView({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-3"
    >
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
      />
      <p className="text-sm text-neutral">{message}</p>
    </div>
  );
}

function ErrorPhaseView({
  info,
  onRetry,
  onReselect,
}: {
  info: ErrorInfo;
  onRetry: () => void;
  onReselect: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
    >
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-foreground">{info.title}</p>
        <p className="text-sm leading-6 text-neutral">{info.message}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          다시 시도
        </button>
        {info.allowReselect ? (
          <button
            type="button"
            onClick={onReselect}
            className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground"
          >
            지역 다시 선택
          </button>
        ) : null}
      </div>
    </div>
  );
}
