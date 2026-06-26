/**
 * Mock API (명세서 §24)
 *
 * NEXT_PUBLIC_ENABLE_MOCK=true 일 때만 사용한다. 백엔드 없이 프론트 전체 흐름
 * (부트스트랩 → 온보딩 → 위치 → today)을 확인하기 위한 개발용 가짜 응답이다.
 *
 * - 행동 완료 상태는 모듈 내 메모리에 보관(새로고침 시 초기화)
 * - 프로필 저장 여부는 localStorage 플래그로 보관(부트스트랩 분기용)
 */
import type {
  AuthenticatedUser,
  CalculationEstimateResponse,
  DailyPlan,
  HealthResponse,
  HourlyWeatherResponse,
  LifestyleAnalysis,
  Me,
  MetaAssumptions,
  MetaEnums,
  Profile,
  RecommendationAction,
  SavingsCalendarResponse,
  SavingsSummary,
  ToggleActionResponse,
  UserProfileUpdateBody,
} from "@/types/api";
import {
  AC_TYPES,
  BUILDING_AGES,
  COMFORT_PREFERENCES,
  CURTAIN_TYPES,
  DAYTIME_HOME_STAYS,
  DIRECTIONS,
  FLOOR_LEVELS,
  HOT_TIME_HOME_STAYS,
  HOUSING_TYPES,
  INSULATION_LEVELS,
  MAIN_ACTIVITY_TIMES,
  OUTDOOR_ACTIVITIES,
  ROOM_SIZES,
  SLEEP_TIMES,
  VENTILATION_LEVELS,
  WINDOW_SEALINGS,
  WINDOW_SIZES,
} from "@/schemas/profile.schema";
import { getTodayKst } from "@/lib/format/date";

export const MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";

const MOCK_USER_ID = "mock-user-0001";
const MOCK_PROFILE_FLAG = "coollink_mock_profile";
let mockUserOverrides: Partial<AuthenticatedUser> = {};

function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/* ── 부트스트랩 상태 (localStorage) ───────────────────── */

function isMockProfileSaved(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MOCK_PROFILE_FLAG) === "1";
  } catch {
    return false;
  }
}

function setMockProfileSaved(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_PROFILE_FLAG, "1");
  } catch {
    /* 무시 */
  }
}

function buildMockAuthenticatedUser(): AuthenticatedUser {
  const profileSaved = isMockProfileSaved();
  return {
    id: MOCK_USER_ID,
    user_id: MOCK_USER_ID,
    name: mockUserOverrides.name ?? "혜성",
    email: "hyesung@gmail.com",
    profileImage: undefined,
    has_profile: profileSaved,
    profileCompleted: profileSaved,
    region: mockUserOverrides.region ?? (profileSaved ? "서울" : null),
    householdSize: mockUserOverrides.householdSize ?? null,
    residenceType:
      mockUserOverrides.residenceType ?? (profileSaved ? "원룸" : null),
    mainCoolingDevice:
      mockUserOverrides.mainCoolingDevice ?? (profileSaved ? "벽걸이" : null),
  };
}

/* ── 행동 완료 상태 (메모리) ──────────────────────────── */

const completion: Record<string, boolean> = {};

const BASE_ACTIONS: Omit<RecommendationAction, "is_completed">[] = [
  {
    action_id: "mock-action-001",
    time_range: "06:00~09:00",
    sort_order: 1,
    action_type: "morning_ventilation",
    title: "아침에 환기하기",
    action: "기온이 낮은 아침에 창문을 열어 더운 공기를 빼주세요.",
    reason: "단열이 보통이고 환기가 잘되는 구조라 아침 환기 효과가 큽니다.",
    estimated_saving_krw: 120,
    estimated_energy_saving_kwh: 0.24,
    estimated_co2_reduction_kg: 0.11,
    difficulty: "쉬움",
  },
  {
    action_id: "mock-action-002",
    time_range: "외출 전",
    sort_order: 2,
    action_type: "shading_before_outing",
    title: "커튼 닫고 나가기",
    action: "외출 전에 커튼을 닫아 오후 햇빛 유입을 줄여주세요.",
    reason: "서향·최상층·큰 창문 구조라 오후에 실내 온도가 오르기 쉽습니다.",
    estimated_saving_krw: 150,
    estimated_energy_saving_kwh: 0.3,
    estimated_co2_reduction_kg: 0.14,
    difficulty: "쉬움",
  },
  {
    action_id: "mock-action-003",
    time_range: "12:00~15:00",
    sort_order: 3,
    action_type: "ac_temperature",
    title: "냉방 26°C로 맞추기",
    action: "한낮에는 설정 온도를 26°C로 두고 선풍기를 함께 사용해주세요.",
    reason: "더운 시간대 집 체류가 잦아 한낮 냉방 효율 관리가 중요합니다.",
    estimated_saving_krw: 280,
    estimated_energy_saving_kwh: 0.56,
    estimated_co2_reduction_kg: 0.27,
    difficulty: "보통",
  },
  {
    action_id: "mock-action-004",
    time_range: "21:00~24:00",
    sort_order: 4,
    action_type: "night_timer",
    title: "취침 타이머 설정",
    action: "잠들기 전 냉방 타이머를 2시간으로 맞춰주세요.",
    reason: "새벽 취침 패턴이라 밤사이 냉방이 길어질 가능성이 높습니다.",
    estimated_saving_krw: 230,
    estimated_energy_saving_kwh: 0.46,
    estimated_co2_reduction_kg: 0.22,
    difficulty: "쉬움",
  },
];

function buildActions(): RecommendationAction[] {
  return BASE_ACTIONS.map((a) => ({
    ...a,
    is_completed: completion[a.action_id] ?? false,
  }));
}

function sumBy(
  actions: RecommendationAction[],
  key:
    | "estimated_saving_krw"
    | "estimated_energy_saving_kwh"
    | "estimated_co2_reduction_kg",
): number {
  return actions.reduce((acc, a) => acc + a[key], 0);
}

function buildPlan(): DailyPlan {
  const actions = buildActions();
  const possibleSaving = sumBy(actions, "estimated_saving_krw");
  return {
    plan_id: "mock-plan-001",
    date: getTodayKst(),
    lifestyle_analysis: {
      primary_type: "야간 활동형",
      secondary_type: "절약 우선형",
      confidence: 0.84,
      summary:
        "새벽 취침과 야간 활동 응답이 강하게 나타나며, 낮 시간 집 체류가 적어 저녁 이후 냉방 관리가 중요합니다.",
    },
    daily_summary: {
      total_estimated_saving_krw: possibleSaving,
      monthly_estimated_saving_krw: possibleSaving * 30,
      total_energy_saving_kwh: sumBy(actions, "estimated_energy_saving_kwh"),
      total_co2_reduction_kg: sumBy(actions, "estimated_co2_reduction_kg"),
      cheer_message: `오늘 추천 행동을 모두 실천하면 약 ${possibleSaving.toLocaleString(
        "ko-KR",
      )}원을 아낄 수 있어요.`,
    },
    actions,
    status: "generated",
  };
}

function buildSummary(period: string = "today"): SavingsSummary {
  const factor = period === "week" ? 5 : period === "month" ? 22 : 1;
  const actions = buildActions();
  const completed = actions.filter((a) => a.is_completed);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const savedBase = sumBy(completed, "estimated_saving_krw");
  const possibleBase = sumBy(actions, "estimated_saving_krw");
  const monthlyProjected = Math.round(savedBase * 30);
  const requiredMonthly = 10000;
  const today = getTodayKst();
  const label = period === "week" ? "이번 주" : period === "month" ? "이번 달" : "오늘";
  return {
    period: (period as SavingsSummary["period"]) ?? "today",
    period_start: today,
    period_end: today,
    completed_action_count: completed.length * factor,
    total_action_count: actions.length * factor,
    total_saving_krw: Math.round(savedBase * factor),
    total_possible_saving_krw: Math.round(possibleBase * factor),
    total_energy_saving_kwh: round2(
      sumBy(completed, "estimated_energy_saving_kwh") * factor,
    ),
    total_possible_energy_saving_kwh: round2(
      sumBy(actions, "estimated_energy_saving_kwh") * factor,
    ),
    total_co2_reduction_kg: round2(
      sumBy(completed, "estimated_co2_reduction_kg") * factor,
    ),
    total_possible_co2_reduction_kg: round2(
      sumBy(actions, "estimated_co2_reduction_kg") * factor,
    ),
    monthly_projected_saving_krw: monthlyProjected,
    goal: {
      monthly_electricity_bill: 50000,
      monthly_goal_bill: 40000,
      required_monthly_saving_krw: requiredMonthly,
      current_projected_saving_krw: monthlyProjected,
      on_track: monthlyProjected >= requiredMonthly,
    },
    message:
      completed.length === 0
        ? `${label} 완료한 절약 행동이 아직 없어요. 첫 행동을 체크해보세요.`
        : `${label} ${completed.length * factor}개의 행동을 실천했어요.`,
  };
}

function buildToggleResponse(
  actionId: string,
  isCompleted: boolean,
): ToggleActionResponse {
  const actions = buildActions();
  const completed = actions.filter((a) => a.is_completed);
  const target = BASE_ACTIONS.find((a) => a.action_id === actionId);
  const savedKrw = sumBy(completed, "estimated_saving_krw");
  const possibleSaving = sumBy(actions, "estimated_saving_krw");
  const rate = possibleSaving > 0 ? savedKrw / possibleSaving : 0;
  return {
    action_id: actionId,
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
    delta: {
      saving_krw: (target?.estimated_saving_krw ?? 0) * (isCompleted ? 1 : -1),
      energy_saving_kwh:
        (target?.estimated_energy_saving_kwh ?? 0) * (isCompleted ? 1 : -1),
      co2_reduction_kg:
        (target?.estimated_co2_reduction_kg ?? 0) * (isCompleted ? 1 : -1),
    },
    today_progress: {
      completed_action_count: completed.length,
      total_action_count: actions.length,
      completed_saving_krw: savedKrw,
      today_estimated_saving_krw: possibleSaving,
      goal_achievement_rate: rate,
      message: isCompleted
        ? `좋아요! 지금까지 약 ${savedKrw.toLocaleString("ko-KR")}원을 아꼈어요. 오늘 목표의 ${Math.round(rate * 100)}%를 달성했습니다.`
        : "완료 표시를 취소했어요. 누적 절약액도 다시 계산했어요.",
    },
  };
}

function buildWeather(): HourlyWeatherResponse {
  const now = new Date();
  return {
    date: getTodayKst(),
    provider: "mock",
    cache: {
      hit: true,
      fetched_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 3_600_000).toISOString(),
    },
    location: { region_name: "서울" },
    time_blocks: [
      block("06:00~09:00", 27, 28, 70, 3, false, 20),
      block("09:00~12:00", 31, 33, 64, 6, false, 45),
      block("12:00~15:00", 34, 36, 58, 8, true, 82),
      block("15:00~18:00", 33, 35, 60, 6, true, 70),
      block("18:00~21:00", 30, 31, 66, 3, false, 35),
      block("21:00~24:00", 28, 29, 72, 1, false, 22),
    ],
  };
}

function block(
  time_range: string,
  temperature: number,
  feels_like: number,
  humidity: number,
  uv_index: number,
  heat_alert: boolean,
  weather_risk_score: number,
) {
  return {
    time_range,
    temperature,
    feels_like,
    humidity,
    rain: false,
    uv_index,
    heat_alert,
    weather_risk_score,
  };
}

const MOCK_PROFILE: Profile = {
  home_environment: {
    housing_type: "오피스텔",
    direction: "서향",
    floor_level: "최상층",
    building_age: "보통",
    insulation_level: "보통",
    window_size: "큼",
    ventilation_level: "잘됨",
    window_sealing: "보통",
  },
  lifestyle: {
    main_activity_time: "야간 활동",
    daytime_home_stay: "거의 없음",
    sleep_time: "새벽",
    outdoor_activity: "보통",
    hot_time_home_stay: "자주",
  },
  energy_profile: {
    monthly_electricity_bill: 50000,
    monthly_goal_bill: 40000,
    comfort_preference: "보통",
    ac_type: "벽걸이",
    has_fan: true,
    curtain_type: "암막",
    ac_power_watt: 1800,
    room_size: "7~10평",
    current_temperature_setting: 26,
    daily_ac_usage_hours: 6,
    electricity_unit_price: 150,
  },
};

const MOCK_ENUMS: MetaEnums = {
  housing_type: [...HOUSING_TYPES],
  direction: [...DIRECTIONS],
  floor_level: [...FLOOR_LEVELS],
  building_age: [...BUILDING_AGES],
  insulation_level: [...INSULATION_LEVELS],
  window_size: [...WINDOW_SIZES],
  ventilation_level: [...VENTILATION_LEVELS],
  window_sealing: [...WINDOW_SEALINGS],
  main_activity_time: [...MAIN_ACTIVITY_TIMES],
  daytime_home_stay: [...DAYTIME_HOME_STAYS],
  sleep_time: [...SLEEP_TIMES],
  outdoor_activity: [...OUTDOOR_ACTIVITIES],
  hot_time_home_stay: [...HOT_TIME_HOME_STAYS],
  ac_type: [...AC_TYPES],
  curtain_type: [...CURTAIN_TYPES],
  room_size: [...ROOM_SIZES],
  comfort_preference: [...COMFORT_PREFERENCES],
  difficulty: ["쉬움", "보통", "어려움"],
};

const MOCK_ASSUMPTIONS: MetaAssumptions = {
  co2_factor_kg_per_kwh: 0.4781,
  electricity_unit_price_krw_per_kwh: 150,
  notes: [
    "CO₂ 계수는 국가 전력 배출계수 기준 예시값입니다.",
    "실제 청구 요금은 누진세에 따라 달라질 수 있어요.",
  ],
};

function buildCalendar(): SavingsCalendarResponse {
  const today = getTodayKst();
  const month = today.slice(0, 7);
  return {
    month,
    days: [
      {
        date: today,
        completed_action_count: buildActions().filter((a) => a.is_completed)
          .length,
        total_saving_krw: sumBy(
          buildActions().filter((a) => a.is_completed),
          "estimated_saving_krw",
        ),
        total_co2_reduction_kg: sumBy(
          buildActions().filter((a) => a.is_completed),
          "estimated_co2_reduction_kg",
        ),
      },
    ],
  };
}

function buildEstimate(body: unknown): CalculationEstimateResponse {
  const b = (body ?? {}) as {
    current_temperature_setting?: number;
    target_temperature_setting?: number;
    daily_ac_usage_hours?: number;
    electricity_unit_price?: number;
    ac_power_watt?: number;
  };
  const watt = b.ac_power_watt ?? 1800;
  const hours = b.daily_ac_usage_hours ?? 6;
  const unit = b.electricity_unit_price ?? 150;
  const current = b.current_temperature_setting ?? 24;
  const target = b.target_temperature_setting ?? 26;
  const currentKwh = (watt / 1000) * hours;
  // 설정 온도 1°C당 약 7% 절감 가정 (데모용)
  const factor = Math.max(0, 1 - (target - current) * 0.07);
  const targetKwh = currentKwh * factor;
  const savingKwh = Math.max(0, currentKwh - targetKwh);
  return {
    current: {
      energy_kwh: Number(currentKwh.toFixed(2)),
      cost_krw: Math.round(currentKwh * unit),
    },
    target: {
      energy_kwh: Number(targetKwh.toFixed(2)),
      cost_krw: Math.round(targetKwh * unit),
    },
    saving: {
      energy_saving_kwh: Number(savingKwh.toFixed(2)),
      saving_krw: Math.round(savingKwh * unit),
      co2_reduction_kg: Number((savingKwh * 0.4781).toFixed(2)),
    },
    assumptions: {
      co2_factor_kg_per_kwh: 0.4781,
      electricity_unit_price_krw_per_kwh: unit,
      note: "데모용 추정치입니다.",
    },
  };
}

const MOCK_LIFESTYLE_ANALYSIS: LifestyleAnalysis = {
  primary_type: "야간 활동형",
  secondary_type: "절약 우선형",
  confidence: 0.84,
  summary: "야간 활동과 새벽 취침 패턴이 뚜렷합니다.",
};

/** 경로/메서드/바디로 mock 응답을 라우팅한다. */
export async function mockRequest<T>(
  path: string,
  method: string,
  body: unknown,
  query?: Record<string, unknown>,
): Promise<T> {
  const as = <V>(value: V) => delay(value) as unknown as Promise<T>;

  // health
  if (path === "/health") return as<HealthResponse>({ status: "ok (mock)" });

  // meta
  if (path.endsWith("/meta/enums")) return as<MetaEnums>(MOCK_ENUMS);
  if (path.endsWith("/meta/assumptions"))
    return as<MetaAssumptions>(MOCK_ASSUMPTIONS);

  // users
  if (path.endsWith("/users/me"))
    return as<Me>({ user_id: MOCK_USER_ID, has_profile: isMockProfileSaved() });
  if (path.endsWith("/user/me") && method === "PATCH") {
    mockUserOverrides = {
      ...mockUserOverrides,
      ...(body as UserProfileUpdateBody),
    };
    return as<AuthenticatedUser>(buildMockAuthenticatedUser());
  }
  if (path.endsWith("/user/me"))
    return as<AuthenticatedUser>(buildMockAuthenticatedUser());

  // profile
  if (path.endsWith("/profile") && method === "PUT") {
    setMockProfileSaved();
    return as<Profile>((body as Profile) ?? MOCK_PROFILE);
  }
  if (path.endsWith("/profile") && method === "GET")
    return as<Profile>(MOCK_PROFILE);
  if (path.includes("/profile/")) return as<Profile>(MOCK_PROFILE); // PATCH 섹션

  // weather
  if (path.endsWith("/weather/hourly") || path.endsWith("/weather/refresh"))
    return as<HourlyWeatherResponse>(buildWeather());

  // analysis / ai
  if (path.endsWith("/analysis/scores")) return as<Record<string, number>>({});
  if (path.endsWith("/ai/lifestyle-analysis"))
    return as<LifestyleAnalysis>(MOCK_LIFESTYLE_ANALYSIS);

  // recommendations
  if (path.endsWith("/recommendations/daily"))
    return as<DailyPlan>(buildPlan());
  if (path.includes("/recommendations/actions/")) {
    const actionId = decodeURIComponent(
      path.split("/recommendations/actions/")[1] ?? "",
    );
    const isCompleted = !!(body as { is_completed?: boolean })?.is_completed;
    completion[actionId] = isCompleted;
    return as<ToggleActionResponse>(buildToggleResponse(actionId, isCompleted));
  }

  // savings
  if (path.endsWith("/savings/summary"))
    return as<SavingsSummary>(
      buildSummary((query?.period as string) ?? "today"),
    );
  if (path.endsWith("/savings/calendar"))
    return as<SavingsCalendarResponse>(buildCalendar());

  // calculations
  if (path.endsWith("/calculations/estimate"))
    return as<CalculationEstimateResponse>(buildEstimate(body));

  throw new Error(`[mock] 처리되지 않은 요청: ${method} ${path}`);
}
