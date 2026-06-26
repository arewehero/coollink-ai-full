/**
 * API 엔드포인트 함수 (명세서 §8 API 연동 매핑)
 *
 * 화면/훅에서 직접 호출하거나, 다음 단계에서 React Query 훅(useEnums, useMe,
 * useDailyPlan 등)으로 감싸 사용한다. 이 파일은 순수 호출 함수만 제공한다.
 */
import { http, requestRaw } from "./client";
import { getTodayKst } from "@/lib/format/date";
import type {
  AnalysisScoresResponse,
  AnonymousUser,
  AuthenticatedUser,
  CalculationEstimateBody,
  CalculationEstimateResponse,
  CreateAnonymousUserBody,
  DailyPlan,
  DailyPlanQuery,
  EnergyProfile,
  GenerateDailyPlanBody,
  HealthResponse,
  HomeEnvironment,
  HourlyWeatherQuery,
  HourlyWeatherResponse,
  LifestyleAnalysis,
  Lifestyle,
  LocationQuery,
  Me,
  MetaAssumptions,
  MetaEnums,
  Profile,
  ProfilePayload,
  SavingsCalendarQuery,
  SavingsCalendarResponse,
  SavingsSummary,
  SavingsSummaryQuery,
  ToggleActionBody,
  ToggleActionResponse,
} from "@/types/api";

/** /api/v1 접두어 */
const V1 = "/api/v1";

/* ── Health (명세서 §8) ────────────────────────────────── */

/** GET /health — 봉투 미적용 가능성이 있어 raw로 처리 */
export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return requestRaw<HealthResponse>("/health", { method: "GET", signal });
}

/* ── Meta (명세서 §8) ──────────────────────────────────── */

/** GET /api/v1/meta/enums — 온보딩/설정 선택지 */
export function getEnums(signal?: AbortSignal): Promise<MetaEnums> {
  return http.get<MetaEnums>(`${V1}/meta/enums`, undefined, signal);
}

/** GET /api/v1/meta/assumptions — 계산 기준값 */
export function getAssumptions(signal?: AbortSignal): Promise<MetaAssumptions> {
  return http.get<MetaAssumptions>(`${V1}/meta/assumptions`, undefined, signal);
}

/* ── Users (명세서 §6, §8) ─────────────────────────────── */

/** POST /api/v1/users/anonymous — 익명 사용자 생성 */
export function createAnonymousUser(
  body: CreateAnonymousUserBody,
  signal?: AbortSignal,
): Promise<AnonymousUser> {
  return http.post<AnonymousUser>(`${V1}/users/anonymous`, body, signal);
}

/** GET /api/v1/users/me — 내 사용자 조회 */
export function getMe(signal?: AbortSignal): Promise<Me> {
  return http.get<Me>(`${V1}/users/me`, undefined, signal);
}

/* ── Profile (명세서 §8) ───────────────────────────────── */

/** PUT /api/v1/profile — 전체 프로필 저장 */
export function saveProfile(
  body: ProfilePayload,
  signal?: AbortSignal,
): Promise<Profile> {
  return http.put<Profile>(`${V1}/profile`, body, signal);
}

/** GET /api/v1/profile — 전체 프로필 조회 */
export function getProfile(signal?: AbortSignal): Promise<Profile> {
  return http.get<Profile>(`${V1}/profile`, undefined, signal);
}

/** PATCH /api/v1/profile/home-environment — 집 환경 수정 */
export function updateHomeEnvironment(
  body: HomeEnvironment,
  signal?: AbortSignal,
): Promise<Profile> {
  return http.patch<Profile>(`${V1}/profile/home-environment`, body, signal);
}

/** PATCH /api/v1/profile/lifestyle — 생활패턴 수정 */
export function updateLifestyle(
  body: Lifestyle,
  signal?: AbortSignal,
): Promise<Profile> {
  return http.patch<Profile>(`${V1}/profile/lifestyle`, body, signal);
}

/** PATCH /api/v1/profile/energy — 냉난방·요금 수정 */
export function updateEnergy(
  body: EnergyProfile,
  signal?: AbortSignal,
): Promise<Profile> {
  return http.patch<Profile>(`${V1}/profile/energy`, body, signal);
}

/* ── Weather (명세서 §8) ───────────────────────────────── */

/** GET /api/v1/weather/hourly — 시간대별 날씨 조회 */
export function getHourlyWeather(
  query: HourlyWeatherQuery,
  signal?: AbortSignal,
): Promise<HourlyWeatherResponse> {
  return http.get<HourlyWeatherResponse>(
    `${V1}/weather/hourly`,
    query,
    signal,
  );
}

/** POST /api/v1/weather/refresh — 날씨 수동 갱신 */
export function refreshWeather(
  body: LocationQuery,
  signal?: AbortSignal,
): Promise<HourlyWeatherResponse> {
  return http.post<HourlyWeatherResponse>(
    `${V1}/weather/refresh`,
    body,
    signal,
  );
}

/* ── Analysis / AI (명세서 §8) — 내부/디버그 ──────────── */

/** POST /api/v1/analysis/scores — 점수 계산(일반 노출 최소화) */
export function calculateScores(
  body: ProfilePayload,
  signal?: AbortSignal,
): Promise<AnalysisScoresResponse> {
  return http.post<AnalysisScoresResponse>(
    `${V1}/analysis/scores`,
    body,
    signal,
  );
}

/** POST /api/v1/ai/lifestyle-analysis — 생활패턴 AI 분석 */
export function analyzeLifestyle(
  body: ProfilePayload,
  signal?: AbortSignal,
): Promise<LifestyleAnalysis> {
  return http.post<LifestyleAnalysis>(
    `${V1}/ai/lifestyle-analysis`,
    body,
    signal,
  );
}

/* ── Recommendations (명세서 §8, §22) ──────────────────── */

/** GET /api/v1/recommendations/daily — 오늘 플랜 조회 */
export function getDailyPlan(
  query: DailyPlanQuery = {},
  signal?: AbortSignal,
): Promise<DailyPlan> {
  return http.get<DailyPlan>(
    `${V1}/recommendations/daily`,
    query,
    signal,
  );
}

/** POST /api/v1/recommendations/daily — 오늘 플랜 생성 */
export async function generateDailyPlan(
  body: GenerateDailyPlanBody = {},
  signal?: AbortSignal,
): Promise<DailyPlan> {
  // 백엔드 추천 생성은 ScoreSnapshot + LifestyleAnalysis가 선행돼야 한다(PREREQUISITE_MISSING 방지).
  // FE는 generateDailyPlan만 호출하므로, 여기서 점수계산·생활유형분석을 먼저 수행한다.
  const date = body.date ?? getTodayKst();
  await calculateScores({ date } as unknown as ProfilePayload, signal);
  await analyzeLifestyle({ date } as unknown as ProfilePayload, signal);
  return http.post<DailyPlan>(
    `${V1}/recommendations/daily`,
    body,
    signal,
  );
}

/** PATCH /api/v1/recommendations/actions/{action_id} — 행동 완료 체크 */
export function toggleAction(
  actionId: string,
  body: ToggleActionBody,
  signal?: AbortSignal,
): Promise<ToggleActionResponse> {
  return http.patch<ToggleActionResponse>(
    `${V1}/recommendations/actions/${encodeURIComponent(actionId)}`,
    body,
    signal,
  );
}

/* ── Savings (명세서 §8) ───────────────────────────────── */

/** GET /api/v1/savings/summary — 절약 요약 */
export function getSavingsSummary(
  query: SavingsSummaryQuery,
  signal?: AbortSignal,
): Promise<SavingsSummary> {
  return http.get<SavingsSummary>(`${V1}/savings/summary`, query, signal);
}

/** GET /api/v1/savings/calendar — 월간 캘린더 */
export function getSavingsCalendar(
  query: SavingsCalendarQuery,
  signal?: AbortSignal,
): Promise<SavingsCalendarResponse> {
  return http.get<SavingsCalendarResponse>(
    `${V1}/savings/calendar`,
    query,
    signal,
  );
}

/* ── Calculations (명세서 §8, §10.14) ──────────────────── */

/** POST /api/v1/calculations/estimate — 요금 시뮬레이션 */
export function estimateCalculation(
  body: CalculationEstimateBody,
  signal?: AbortSignal,
): Promise<CalculationEstimateResponse> {
  return http.post<CalculationEstimateResponse>(
    `${V1}/calculations/estimate`,
    body,
    signal,
  );
}

/* ── Auth (codex 통합: Google 로그인) ─────────────────── */

/** GET /api/v1/user/me — 로그인 사용자 정보 (JWT Bearer) */
export function getAuthenticatedMe(
  signal?: AbortSignal,
): Promise<AuthenticatedUser> {
  return http.get<AuthenticatedUser>(`${V1}/user/me`, undefined, signal);
}

/** GET /api/v1/auth/google/login — Google OAuth 시작 URL (리다이렉트용 절대경로) */
export function getGoogleOAuthLoginUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return `${base}${V1}/auth/google/login`;
}

/**
 * 모든 엔드포인트를 모은 네임스페이스.
 * 명세서 §6.2, §22의 `api.createAnonymousUser`, `api.getDailyPlan`,
 * `api.toggleAction` 등 호출 형태와 일치한다.
 */
export const api = {
  getHealth,
  getEnums,
  getAssumptions,
  createAnonymousUser,
  getMe,
  saveProfile,
  getProfile,
  updateHomeEnvironment,
  updateLifestyle,
  updateEnergy,
  getHourlyWeather,
  refreshWeather,
  calculateScores,
  analyzeLifestyle,
  getDailyPlan,
  generateDailyPlan,
  toggleAction,
  getSavingsSummary,
  getSavingsCalendar,
  estimateCalculation,
  getAuthenticatedMe,
  getGoogleOAuthLoginUrl,
} as const;
