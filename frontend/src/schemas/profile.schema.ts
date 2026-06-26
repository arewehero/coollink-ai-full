/**
 * 프로필 입력 검증 스키마 (명세서 §9.2, §10.3~§10.5, §12)
 *
 * 온보딩 3단계 폼의 단일 소스. 선택지 상수(옵션)와 Zod 스키마를 함께 둔다.
 * 수치 범위는 명세서 §10.5 검증 표 / §12.1 예시를 따른다.
 */
import { z } from "zod";

/* ── 선택지 상수 (명세서 §9.1) ─────────────────────────── */

export const HOUSING_TYPES = [
  "원룸",
  "오피스텔",
  "아파트",
  "단독주택",
  "다세대",
] as const;
export const DIRECTIONS = [
  "북향",
  "북동향",
  "동향",
  "남동향",
  "남향",
  "남서향",
  "서향",
  "북서향",
] as const;
export const FLOOR_LEVELS = [
  "반지하",
  "1층",
  "저층",
  "중층",
  "고층",
  "최상층",
] as const;
export const BUILDING_AGES = ["신축", "보통", "노후"] as const;
export const INSULATION_LEVELS = ["좋음", "보통", "약함"] as const;
export const WINDOW_SIZES = ["작음", "보통", "큼"] as const;
export const VENTILATION_LEVELS = ["잘됨", "보통", "잘 안됨"] as const;
export const WINDOW_SEALINGS = ["잘 막힘", "보통", "틈새 있음"] as const;

export const MAIN_ACTIVITY_TIMES = [
  "아침형",
  "낮 활동",
  "야간 활동",
  "불규칙",
] as const;
export const DAYTIME_HOME_STAYS = [
  "거의 없음",
  "오후 잠깐",
  "오후 오래",
  "종일 재택",
] as const;
export const SLEEP_TIMES = ["밤", "새벽", "오전", "불규칙"] as const;
export const OUTDOOR_ACTIVITIES = ["적음", "보통", "많음"] as const;
export const HOT_TIME_HOME_STAYS = [
  "아니요",
  "가끔",
  "자주",
  "거의 항상",
] as const;

export const AC_TYPES = ["없음", "벽걸이", "스탠드", "둘 다"] as const;
export const CURTAIN_TYPES = ["없음", "일반", "암막"] as const;
export const ROOM_SIZES = ["~6평", "7~10평", "11~14평", "15평~"] as const;
export const COMFORT_PREFERENCES = [
  "시원한 편 선호",
  "보통",
  "절약 우선",
] as const;

/* ── 메시지 (명세서 §12.2) ─────────────────────────────── */

const SELECT_REQUIRED = "이 항목을 선택해주세요.";
const RANGE_INVALID = "입력 가능한 범위를 확인해주세요.";
const BILL_REQUIRED = "최근 월 전기요금을 입력해주세요.";

/* ── 1단계: 집 환경 (명세서 §10.3) ─────────────────────── */

export const homeEnvironmentSchema = z.object({
  housing_type: z.enum(HOUSING_TYPES, { error: SELECT_REQUIRED }),
  direction: z.enum(DIRECTIONS, { error: SELECT_REQUIRED }),
  floor_level: z.enum(FLOOR_LEVELS, { error: SELECT_REQUIRED }),
  building_age: z.enum(BUILDING_AGES, { error: SELECT_REQUIRED }),
  insulation_level: z.enum(INSULATION_LEVELS, { error: SELECT_REQUIRED }),
  window_size: z.enum(WINDOW_SIZES, { error: SELECT_REQUIRED }),
  ventilation_level: z.enum(VENTILATION_LEVELS, { error: SELECT_REQUIRED }),
  window_sealing: z.enum(WINDOW_SEALINGS, { error: SELECT_REQUIRED }),
});

/* ── 2단계: 생활패턴 (명세서 §10.4) ────────────────────── */

export const lifestyleSchema = z.object({
  main_activity_time: z.enum(MAIN_ACTIVITY_TIMES, { error: SELECT_REQUIRED }),
  daytime_home_stay: z.enum(DAYTIME_HOME_STAYS, { error: SELECT_REQUIRED }),
  sleep_time: z.enum(SLEEP_TIMES, { error: SELECT_REQUIRED }),
  outdoor_activity: z.enum(OUTDOOR_ACTIVITIES, { error: SELECT_REQUIRED }),
  hot_time_home_stay: z.enum(HOT_TIME_HOME_STAYS, { error: SELECT_REQUIRED }),
});

/* ── 3단계: 냉난방·전기요금 (명세서 §10.5, §12.1) ──────── */

export const energyProfileSchema = z.object({
  monthly_electricity_bill: z
    .number({ error: BILL_REQUIRED })
    .min(0, RANGE_INVALID)
    .max(1_000_000, RANGE_INVALID),
  monthly_goal_bill: z
    .number()
    .min(0, RANGE_INVALID)
    .max(1_000_000, RANGE_INVALID)
    .nullable()
    .optional(),
  comfort_preference: z.enum(COMFORT_PREFERENCES, { error: SELECT_REQUIRED }),
  ac_type: z.enum(AC_TYPES, { error: SELECT_REQUIRED }),
  has_fan: z.boolean(),
  curtain_type: z.enum(CURTAIN_TYPES, { error: SELECT_REQUIRED }),
  ac_power_watt: z
    .number()
    .min(100, RANGE_INVALID)
    .max(5000, RANGE_INVALID)
    .nullable()
    .optional(),
  room_size: z.enum(ROOM_SIZES).nullable().optional(),
  current_temperature_setting: z
    .number()
    .min(18, RANGE_INVALID)
    .max(30, RANGE_INVALID)
    .nullable()
    .optional(),
  daily_ac_usage_hours: z
    .number()
    .min(0, RANGE_INVALID)
    .max(24, RANGE_INVALID)
    .nullable()
    .optional(),
  electricity_unit_price: z
    .number()
    .min(1, RANGE_INVALID)
    .max(1000, RANGE_INVALID)
    .nullable()
    .optional(),
});

/* ── 전체 프로필 ───────────────────────────────────────── */

export const profileSchema = z.object({
  home_environment: homeEnvironmentSchema,
  lifestyle: lifestyleSchema,
  energy_profile: energyProfileSchema,
});

/** 폼 입력 타입 (편집 중에는 enum 미선택/숫자 미입력 허용) */
export type ProfileSchemaInput = z.input<typeof profileSchema>;
/** 검증 통과 후 출력 타입 (= ProfilePayload 구조) */
export type ProfileSchemaOutput = z.output<typeof profileSchema>;

/** 단계별 검증 대상 필드 (form.trigger 용) */
export const STEP_FIELD_GROUPS = [
  "home_environment",
  "lifestyle",
  "energy_profile",
] as const;

/** 단계별 미입력 시 안내 (명세서 §10.3, §10.4) */
export const STEP_ERROR_MESSAGES = [
  "집 환경 정보를 모두 선택해주세요.",
  "생활패턴을 모두 선택해주세요.",
  "필수 항목을 모두 입력해주세요.",
] as const;
