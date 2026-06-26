import type { RoomSize } from "@/types/api";

/** 시뮬레이터 입력 (명세서 §10.14) */
export type SimInput = {
  current_temperature_setting: number;
  target_temperature_setting: number;
  daily_ac_usage_hours: number;
  ac_power_watt: number | null;
  electricity_unit_price: number | null;
  room_size: RoomSize | null;
};

export const DEFAULT_SIM_INPUT: SimInput = {
  current_temperature_setting: 24,
  target_temperature_setting: 26,
  daily_ac_usage_hours: 6,
  ac_power_watt: 1800,
  electricity_unit_price: 150,
  room_size: null,
};
