/**
 * CoolLink AI — API 타입 (명세서 §7, §9)
 *
 * 명세서 §20.3: "API 타입은 types/api.ts에 모아 관리한다."
 * 백엔드 FastAPI와의 계약(요청/응답)을 한곳에서 관리한다.
 *
 * 참고: 명세서에 응답 형태가 명시되지 않은 일부 엔드포인트(meta, analysis,
 * calculations, savings/calendar, health)는 합리적으로 추론한 형태이며,
 * 백엔드 확정 시 조정한다. 해당 부분에는 주석으로 표기했다.
 */

/* ──────────────────────────────────────────────────────────
 * 1. 공통 응답 / 에러 (명세서 §7.1, §7.2)
 * ────────────────────────────────────────────────────────── */

export type ApiMeta = {
  request_id?: string;
  generated_at?: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: ApiMeta;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ApiErrorCode =
  | "USER_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "profile_required"
  | "INVALID_PROFILE_INPUT"
  | "WEATHER_FETCH_FAILED"
  | "WEATHER_CACHE_MISS"
  | "AI_GENERATION_FAILED"
  | "AI_RESPONSE_INVALID"
  | "RECOMMENDATION_NOT_FOUND"
  | "ACTION_ALREADY_COMPLETED"
  | "ACTION_NOT_COMPLETED"
  | "CALCULATION_FAILED"
  | "RATE_LIMIT_EXCEEDED"
  | "UNKNOWN_ERROR";

/* ──────────────────────────────────────────────────────────
 * 2. Enum 타입 (명세서 §9.1)
 * ────────────────────────────────────────────────────────── */

export type HousingType = "원룸" | "오피스텔" | "아파트" | "단독주택" | "다세대";
export type Direction =
  | "북향"
  | "북동향"
  | "동향"
  | "남동향"
  | "남향"
  | "남서향"
  | "서향"
  | "북서향";
export type FloorLevel = "반지하" | "1층" | "저층" | "중층" | "고층" | "최상층";
export type BuildingAge = "신축" | "보통" | "노후";
export type InsulationLevel = "좋음" | "보통" | "약함";
export type WindowSize = "작음" | "보통" | "큼";
export type VentilationLevel = "잘됨" | "보통" | "잘 안됨";
export type WindowSealing = "잘 막힘" | "보통" | "틈새 있음";

export type MainActivityTime = "아침형" | "낮 활동" | "야간 활동" | "불규칙";
export type DaytimeHomeStay = "거의 없음" | "오후 잠깐" | "오후 오래" | "종일 재택";
export type SleepTime = "밤" | "새벽" | "오전" | "불규칙";
export type OutdoorActivity = "적음" | "보통" | "많음";
export type HotTimeHomeStay = "아니요" | "가끔" | "자주" | "거의 항상";

export type AcType = "없음" | "벽걸이" | "스탠드" | "둘 다";
export type CurtainType = "없음" | "일반" | "암막";
export type RoomSize = "~6평" | "7~10평" | "11~14평" | "15평~";
export type ComfortPreference = "시원한 편 선호" | "보통" | "절약 우선";
export type Difficulty = "쉬움" | "보통" | "어려움";

/* ──────────────────────────────────────────────────────────
 * 3. 프로필 (명세서 §9.2)
 * ────────────────────────────────────────────────────────── */

export type HomeEnvironment = {
  housing_type: HousingType;
  direction: Direction;
  floor_level: FloorLevel;
  building_age: BuildingAge;
  insulation_level: InsulationLevel;
  window_size: WindowSize;
  ventilation_level: VentilationLevel;
  window_sealing: WindowSealing;
};

export type Lifestyle = {
  main_activity_time: MainActivityTime;
  daytime_home_stay: DaytimeHomeStay;
  sleep_time: SleepTime;
  outdoor_activity: OutdoorActivity;
  hot_time_home_stay: HotTimeHomeStay;
};

export type EnergyProfile = {
  monthly_electricity_bill: number;
  monthly_goal_bill?: number | null;
  comfort_preference: ComfortPreference;
  ac_type: AcType;
  has_fan: boolean;
  curtain_type: CurtainType;
  ac_power_watt?: number | null;
  room_size?: RoomSize | null;
  current_temperature_setting?: number | null;
  daily_ac_usage_hours?: number | null;
  electricity_unit_price?: number | null;
};

export type ProfilePayload = {
  home_environment: HomeEnvironment;
  lifestyle: Lifestyle;
  energy_profile: EnergyProfile;
};

/** 조회된 전체 프로필 (저장 payload와 동일 구조) */
export type Profile = ProfilePayload;

/* ──────────────────────────────────────────────────────────
 * 4. 사용자 / 인증
 * ────────────────────────────────────────────────────────── */

export type Me = {
  user_id: string;
  has_profile: boolean;
  created_at?: string;
};

export type AuthenticatedUser = {
  id?: number | string;
  user_id?: string;
  name?: string | null;
  email?: string | null;
  profileImage?: string | null;
  profile_image?: string | null;
  picture_url?: string | null;
  avatar_url?: string | null;
  has_profile?: boolean;
  profileCompleted?: boolean;
  profile_completed?: boolean;
  region?: string | null;
  householdSize?: number | null;
  household_size?: number | null;
  residenceType?: string | null;
  residence_type?: string | null;
  mainCoolingDevice?: string | null;
  main_cooling_device?: string | null;
};

export type UserProfileUpdateBody = {
  name?: string | null;
  region?: string | null;
  householdSize?: number | null;
  residenceType?: string | null;
  mainCoolingDevice?: string | null;
};

/* ──────────────────────────────────────────────────────────
 * 5. 메타 (명세서 §8) — 응답 형태 추론, 백엔드 확정 시 조정
 * ────────────────────────────────────────────────────────── */

/** GET /meta/enums — 온보딩/설정 선택지. 필드별 선택 가능한 값 목록 */
export type MetaEnums = {
  housing_type: HousingType[];
  direction: Direction[];
  floor_level: FloorLevel[];
  building_age: BuildingAge[];
  insulation_level: InsulationLevel[];
  window_size: WindowSize[];
  ventilation_level: VentilationLevel[];
  window_sealing: WindowSealing[];
  main_activity_time: MainActivityTime[];
  daytime_home_stay: DaytimeHomeStay[];
  sleep_time: SleepTime[];
  outdoor_activity: OutdoorActivity[];
  hot_time_home_stay: HotTimeHomeStay[];
  ac_type: AcType[];
  curtain_type: CurtainType[];
  room_size: RoomSize[];
  comfort_preference: ComfortPreference[];
  difficulty: Difficulty[];
};

/** GET /meta/assumptions — CO₂ 계수, 단가 등 계산 기준값 */
export type MetaAssumptions = {
  co2_factor_kg_per_kwh?: number;
  electricity_unit_price_krw_per_kwh?: number;
  notes?: string[];
  /** 추가 기준값은 백엔드 확정 시 정의 */
  [key: string]: unknown;
};

/* ──────────────────────────────────────────────────────────
 * 6. 위치 (명세서 §9.3)
 * ────────────────────────────────────────────────────────── */

export type LocationState =
  | {
      type: "gps";
      latitude: number;
      longitude: number;
      region_name?: string;
    }
  | {
      type: "region";
      region_name: string;
      latitude?: number;
      longitude?: number;
    };

/** 날씨/추천 요청에 사용하는 위치 질의 파라미터 */
export type LocationQuery = {
  latitude?: number;
  longitude?: number;
  region_name?: string;
};

/* ──────────────────────────────────────────────────────────
 * 7. 날씨 (명세서 §9.4)
 * ────────────────────────────────────────────────────────── */

export type WeatherTimeBlock = {
  time_range: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  rain: boolean;
  uv_index: number;
  heat_alert: boolean;
  weather_risk_score: number;
};

export type HourlyWeatherResponse = {
  date: string;
  provider: "openweathermap" | "kma" | string;
  cache: {
    hit: boolean;
    fetched_at: string;
    expires_at: string;
  };
  location: {
    latitude?: number;
    longitude?: number;
    region_name?: string;
  };
  time_blocks: WeatherTimeBlock[];
};

export type HourlyWeatherQuery = LocationQuery & {
  /** YYYY-MM-DD (Asia/Seoul 기준) */
  date?: string;
};

/* ──────────────────────────────────────────────────────────
 * 8. 분석 / AI (명세서 §8) — 내부/디버그용, 응답 형태 추론
 * ────────────────────────────────────────────────────────── */

/** POST /analysis/scores — 일반 사용자 노출 최소화 */
export type AnalysisScoresResponse = Record<string, number>;

/* ──────────────────────────────────────────────────────────
 * 9. 추천 플랜 (명세서 §9.5, §9.6)
 * ────────────────────────────────────────────────────────── */

export type LifestyleAnalysis = {
  primary_type: string;
  secondary_type: string;
  confidence: number;
  summary: string;
};

export type DailySummary = {
  total_estimated_saving_krw: number;
  monthly_estimated_saving_krw: number;
  total_energy_saving_kwh: number;
  total_co2_reduction_kg: number;
  cheer_message: string;
};

export type RecommendationAction = {
  action_id: string;
  time_range: string;
  sort_order: number;
  action_type: string;
  title: string;
  action: string;
  reason: string;
  estimated_saving_krw: number;
  estimated_energy_saving_kwh: number;
  estimated_co2_reduction_kg: number;
  difficulty: Difficulty;
  is_completed: boolean;
};

export type DailyPlanStatus = "generated" | "fallback" | "cached" | string;

export type DailyPlan = {
  plan_id: string;
  date: string;
  lifestyle_analysis: LifestyleAnalysis;
  daily_summary: DailySummary;
  actions: RecommendationAction[];
  status: DailyPlanStatus;
};

/** GET /recommendations/daily 질의 */
export type DailyPlanQuery = {
  /** YYYY-MM-DD (Asia/Seoul). 미지정 시 백엔드 today */
  date?: string;
};

/** POST /recommendations/daily 본문 */
export type GenerateDailyPlanBody = {
  date?: string;
  force_regenerate?: boolean;
} & LocationQuery;

/** PATCH /recommendations/actions/{action_id} 본문 */
export type ToggleActionBody = {
  is_completed: boolean;
};

/** 행동 체크 응답 (명세서 §9.6) */
export type ToggleActionResponse = {
  action_id: string;
  is_completed: boolean;
  completed_at?: string | null;
  delta: {
    saving_krw: number;
    energy_saving_kwh: number;
    co2_reduction_kg: number;
  };
  today_progress: {
    completed_action_count: number;
    total_action_count: number;
    completed_saving_krw: number;
    today_estimated_saving_krw: number;
    goal_achievement_rate: number;
    message: string;
  };
};

/* ──────────────────────────────────────────────────────────
 * 10. 절약 요약 / 캘린더 (명세서 §9.7, §10.13)
 * ────────────────────────────────────────────────────────── */

export type SavingsPeriod = "today" | "week" | "month";

export type SavingsSummary = {
  period: SavingsPeriod;
  period_start: string;
  period_end: string;
  completed_action_count: number;
  total_action_count: number;
  total_saving_krw: number;
  total_possible_saving_krw: number;
  total_energy_saving_kwh: number;
  total_possible_energy_saving_kwh: number;
  total_co2_reduction_kg: number;
  total_possible_co2_reduction_kg: number;
  monthly_projected_saving_krw: number;
  goal?: {
    monthly_electricity_bill: number;
    monthly_goal_bill?: number | null;
    required_monthly_saving_krw?: number | null;
    current_projected_saving_krw: number;
    on_track: boolean;
  };
  message: string;
};

export type SavingsSummaryQuery = {
  period: SavingsPeriod;
};

/** GET /savings/calendar — 응답 형태 추론, 백엔드 확정 시 조정 */
export type SavingsCalendarDay = {
  date: string;
  completed_action_count: number;
  total_saving_krw: number;
  total_co2_reduction_kg: number;
};

export type SavingsCalendarResponse = {
  /** YYYY-MM */
  month: string;
  days: SavingsCalendarDay[];
};

export type SavingsCalendarQuery = {
  /** YYYY-MM */
  month: string;
};

/* ──────────────────────────────────────────────────────────
 * 11. 요금 시뮬레이션 (명세서 §10.14) — 응답 형태 추론
 * ────────────────────────────────────────────────────────── */

export type CalculationEstimateBody = {
  ac_power_watt?: number | null;
  room_size?: RoomSize | null;
  current_temperature_setting?: number;
  target_temperature_setting?: number;
  daily_ac_usage_hours?: number;
  electricity_unit_price?: number | null;
};

export type CalculationEstimateResponse = {
  current: { energy_kwh: number; cost_krw: number };
  target: { energy_kwh: number; cost_krw: number };
  saving: {
    energy_saving_kwh: number;
    saving_krw: number;
    co2_reduction_kg: number;
  };
  assumptions: Record<string, unknown>;
};

/* ──────────────────────────────────────────────────────────
 * 12. Health (명세서 §8) — 봉투(envelope) 미적용 가능, raw 처리
 * ────────────────────────────────────────────────────────── */

export type HealthResponse = {
  status: string;
  [key: string]: unknown;
};
