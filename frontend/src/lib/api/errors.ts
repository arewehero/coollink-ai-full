/**
 * API 에러 정규화 (명세서 §7.2, §7.3, §14.1)
 *
 * 백엔드의 ApiFailure 응답 또는 네트워크/파싱 실패를 단일 `ApiError`로 정규화한다.
 * 화면 단에서는 `error.code`(ApiErrorCode)로 분기해 §14.1 표대로 처리한다.
 */
import type { ApiErrorCode, ApiFailure } from "@/types/api";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** HTTP 상태 코드. 0이면 네트워크 오류(응답 없음). */
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;
  /** fetch 자체가 실패한 네트워크 오류 여부 (명세서 §14.1 "네트워크 오류") */
  readonly isNetworkError: boolean;

  constructor(params: {
    code: ApiErrorCode;
    message: string;
    status: number;
    details?: Record<string, unknown>;
    requestId?: string;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
    this.requestId = params.requestId;
    this.isNetworkError = params.isNetworkError ?? false;
  }

  /** fetch throw(오프라인/CORS/타임아웃 등)를 네트워크 오류로 정규화 */
  static network(cause?: unknown): ApiError {
    return new ApiError({
      code: "UNKNOWN_ERROR",
      message: "네트워크 연결이 불안정해요. 잠시 후 다시 시도해주세요.",
      status: 0,
      isNetworkError: true,
      details: cause ? { cause: String(cause) } : undefined,
    });
  }
}

/** HTTP 상태 → 에러 코드 fallback (본문에 code가 없을 때만 사용) */
function codeFromStatus(status: number): ApiErrorCode {
  if (status === 429) return "RATE_LIMIT_EXCEEDED";
  return "UNKNOWN_ERROR";
}

/**
 * 응답 본문과 상태 코드를 ApiError로 정규화한다 (명세서 §7.3).
 * @param body  파싱된 응답 본문(ApiFailure 또는 임의 값). 파싱 실패 시 null.
 * @param status HTTP 상태 코드
 */
export function normalizeApiError(body: unknown, status: number): ApiError {
  if (isApiFailure(body)) {
    return new ApiError({
      code: body.error.code,
      message: body.error.message,
      status,
      details: body.error.details,
      requestId: body.meta?.request_id,
    });
  }

  return new ApiError({
    code: codeFromStatus(status),
    message:
      status === 0
        ? "네트워크 연결이 불안정해요. 잠시 후 다시 시도해주세요."
        : "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.",
    status,
  });
}

/** ApiFailure 형태인지 좁히는 타입 가드 */
export function isApiFailure(value: unknown): value is ApiFailure {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.success !== false) return false;
  const error = v.error as Record<string, unknown> | undefined;
  return (
    typeof error === "object" &&
    error !== null &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}

/** 잡은 에러가 ApiError인지 좁히는 타입 가드 (화면/훅에서 분기용) */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** 특정 에러 코드인지 빠르게 확인 */
export function isApiErrorCode(value: unknown, code: ApiErrorCode): boolean {
  return isApiError(value) && value.code === code;
}
