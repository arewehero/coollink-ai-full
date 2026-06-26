/**
 * 전력량 / CO₂ 표시 (명세서 §16.4, §23.1)
 */
function toFixed2(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value.toFixed(2);
}

/** 예: 1.56 → "1.56kWh" */
export function formatKwh(value: number | null | undefined): string {
  const n = toFixed2(value);
  return n == null ? "0kWh" : `${n}kWh`;
}

/** 예: 0.75 → "0.75kg CO₂" */
export function formatCo2(value: number | null | undefined): string {
  const n = toFixed2(value);
  return n == null ? "0kg CO₂" : `${n}kg CO₂`;
}
