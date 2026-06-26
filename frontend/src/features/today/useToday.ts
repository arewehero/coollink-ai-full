"use client";

/**
 * useToday — /today 데이터 오케스트레이션 (명세서 §10.7~§10.12)
 *
 * - 플랜: GET /recommendations/daily → 없으면 POST 로 생성
 * - 요약: GET /savings/summary?period=today → 진행률 카드
 * - 날씨: GET /weather/hourly (저장된 위치) → 날씨 카드 (보조, 실패해도 본문 유지)
 * - 행동 완료 토글: PATCH (낙관적 업데이트 + 서버 값으로 재동기화)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, isApiError } from "@/lib/api";
import type {
  DailyPlan,
  GenerateDailyPlanBody,
  HourlyWeatherQuery,
  HourlyWeatherResponse,
  LocationState,
  RecommendationAction,
  SavingsSummary,
  ToggleActionResponse,
} from "@/types/api";
import { getStoredLocation } from "@/lib/storage/location";
import { getTodayKst } from "@/lib/format/date";
import { useToast } from "@/components/common/ToastProvider";

export type LoadStatus = "loading" | "ready" | "error";
export type WeatherStatus = "loading" | "ready" | "error" | "no-location";

/** 진행률 카드용 통합 모델 (요약/토글 응답 형태를 단일화) */
export type TodayProgress = {
  completed: number;
  total: number;
  savedKrw: number;
  goalRate?: number | null;
  message?: string;
};

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "서울";

function progressFromSummary(s: SavingsSummary): TodayProgress {
  return {
    completed: s.completed_action_count,
    total: s.total_action_count,
    savedKrw: s.total_saving_krw,
    message: s.message,
  };
}

function progressFromToggle(p: ToggleActionResponse["today_progress"]): TodayProgress {
  return {
    completed: p.completed_action_count,
    total: p.total_action_count,
    savedKrw: p.completed_saving_krw,
    goalRate: p.goal_achievement_rate,
    message: p.message,
  };
}

/** 토글 직후 즉각 반영용 낙관적 진행률 계산 */
function shiftProgress(
  prev: TodayProgress,
  action: RecommendationAction,
  willComplete: boolean,
): TodayProgress {
  const delta = willComplete ? 1 : -1;
  return {
    ...prev,
    completed: Math.max(0, Math.min(prev.total, prev.completed + delta)),
    savedKrw: Math.max(0, prev.savedKrw + delta * action.estimated_saving_krw),
  };
}

function applyActionCompleted(
  plan: DailyPlan,
  actionId: string,
  isCompleted: boolean,
): DailyPlan {
  return {
    ...plan,
    actions: plan.actions.map((a) =>
      a.action_id === actionId ? { ...a, is_completed: isCompleted } : a,
    ),
  };
}

function weatherQuery(location: LocationState, date: string): HourlyWeatherQuery {
  if (location.type === "gps") {
    return { latitude: location.latitude, longitude: location.longitude, date };
  }
  return { region_name: location.region_name, date };
}

function generateBody(location: LocationState | null, date: string): GenerateDailyPlanBody {
  const body: GenerateDailyPlanBody = { date };
  if (location?.type === "gps") {
    body.latitude = location.latitude;
    body.longitude = location.longitude;
  } else if (location?.type === "region") {
    body.region_name = location.region_name;
  }
  return body;
}

export function useToday() {
  const router = useRouter();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [progress, setProgress] = useState<TodayProgress | null>(null);
  const [weather, setWeather] = useState<HourlyWeatherResponse | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>("loading");
  const [regionName, setRegionName] = useState<string>(DEFAULT_REGION);
  const [pendingActionIds, setPendingActionIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [attempt, setAttempt] = useState(0);

  const { showToast } = useToast();

  const pendingRef = useRef<Set<string>>(new Set());

  const setPending = (id: string, on: boolean) => {
    const next = new Set(pendingRef.current);
    if (on) next.add(id);
    else next.delete(id);
    pendingRef.current = next;
    setPendingActionIds(next);
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const date = getTodayKst();
    const location = getStoredLocation();

    const loadPlan = async (): Promise<DailyPlan | null> => {
      try {
        return await api.getDailyPlan({ date }, controller.signal);
      } catch (error) {
        if (isApiError(error) && error.code === "PROFILE_NOT_FOUND") {
          router.replace("/onboarding");
          return null;
        }
        const missing =
          isApiError(error) &&
          (error.code === "RECOMMENDATION_NOT_FOUND" || error.status === 404);
        if (!missing) throw error;
        // 플랜 없음 → 생성 (명세서 §10.7)
        return api.generateDailyPlan(generateBody(location, date), controller.signal);
      }
    };

    (async () => {
      try {
        const loadedPlan = await loadPlan();
        if (!active || controller.signal.aborted) return;
        if (!loadedPlan) return; // 온보딩으로 리다이렉트된 경우
        setPlan(loadedPlan);
        setStatus("ready");
        // 저장된 지역을 헤더에 우선 표시 (날씨 응답이 오면 덮어씀)
        if (location?.region_name) setRegionName(location.region_name);
      } catch {
        if (!active || controller.signal.aborted) return;
        setStatus("error");
        return;
      }

      // 요약 (보조)
      api
        .getSavingsSummary({ period: "today" }, controller.signal)
        .then((s) => {
          if (!active) return;
          setSummary(s);
          setProgress(progressFromSummary(s));
        })
        .catch(() => {
          /* 요약 실패 시 진행률은 토글 응답으로 채워진다 */
        });

      // 날씨 (보조)
      if (!location) {
        setWeatherStatus("no-location");
      } else {
        setWeatherStatus("loading");
        api
          .getHourlyWeather(weatherQuery(location, date), controller.signal)
          .then((w) => {
            if (!active) return;
            setWeather(w);
            if (w.location?.region_name) setRegionName(w.location.region_name);
            setWeatherStatus("ready");
          })
          .catch(() => {
            if (!active) return;
            setWeatherStatus("error");
          });
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, router]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const refreshSummary = useCallback(() => {
    api
      .getSavingsSummary({ period: "today" })
      .then((s) => {
        setSummary(s);
        setProgress(progressFromSummary(s));
      })
      .catch(() => {
        /* 무시 — 다음 동작에서 재시도 */
      });
  }, []);

  const toggleAction = useCallback(
    async (action: RecommendationAction) => {
      const id = action.action_id;
      // 중복 클릭/연타 방지 (명세서 §10.12)
      if (pendingRef.current.has(id)) return;

      const next = !action.is_completed;
      setPending(id, true);
      // 낙관적 업데이트
      setPlan((prev) => (prev ? applyActionCompleted(prev, id, next) : prev));
      setProgress((prev) => (prev ? shiftProgress(prev, action, next) : prev));

      try {
        const res = await api.toggleAction(id, { is_completed: next });
        // 서버 권위값으로 확정 + 진행률 갱신 (명세서 §10.12)
        setPlan((prev) =>
          prev ? applyActionCompleted(prev, id, res.is_completed) : prev,
        );
        setProgress(progressFromToggle(res.today_progress));
        // savings summary 재조회로 동기화 (React Query 미사용 → invalidate 대신 refetch)
        refreshSummary();
        // 완료/취소 토스트 (명세서 §10.12) — today_progress.message 우선
        const fallback = res.is_completed
          ? "완료했어요! 누적 절약액을 갱신했어요."
          : "완료 표시를 취소했어요. 누적 절약액도 다시 계산했어요.";
        showToast(
          res.today_progress.message?.trim() || fallback,
          res.is_completed ? "success" : "info",
        );
      } catch {
        // 롤백 + 서버 재동기화 (명세서 §10.12)
        setPlan((prev) =>
          prev ? applyActionCompleted(prev, id, action.is_completed) : prev,
        );
        refreshSummary();
        showToast("완료 처리에 실패했어요. 다시 시도해주세요.", "error");
      } finally {
        setPending(id, false);
      }
    },
    [refreshSummary, showToast],
  );

  return {
    status,
    plan,
    summary,
    progress,
    weather,
    weatherStatus,
    regionName,
    pendingActionIds,
    toggleAction,
    retry,
  };
}
