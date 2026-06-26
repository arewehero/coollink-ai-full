/**
 * API client (명세서 §6.3, §7.3)
 *
 * - NEXT_PUBLIC_API_BASE_URL 기준으로 요청한다.
 * - 모든 요청에 X-User-Id 헤더를 포함한다(있을 때).
 * - 공통 응답(success/data/error/meta)을 처리하고 success 시 data만 반환한다.
 * - 실패 시 ApiError로 정규화해 throw 한다.
 */
import type { ApiResponse } from "@/types/api";
import { MOCK_ENABLED, mockRequest } from "@/lib/mock/api";
import { getAccessToken } from "@/lib/storage/auth";
import { getStoredUserId } from "@/lib/storage/user";
import { ApiError, normalizeApiError } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON 직렬화되어 body로 전송 */
  body?: unknown;
  /** 쿼리스트링으로 직렬화 (undefined/null 값은 제외) */
  query?: QueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function buildHeaders(custom?: Record<string, string>): HeadersInit {
  const userId = getStoredUserId();
  const accessToken = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(userId ? { "X-User-Id": userId } : {}),
    ...custom,
  };
}

async function rawFetch(
  path: string,
  options: RequestOptions,
): Promise<Response> {
  const { method = "GET", body, query, headers, signal } = options;
  try {
    return await fetch(buildUrl(path, query), {
      method,
      signal,
      headers: buildHeaders(headers),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    // fetch 자체 실패(오프라인/CORS/abort 등) → 네트워크 오류로 정규화
    throw ApiError.network(cause);
  }
}

async function parseJson(res: Response): Promise<unknown> {
  // 204/빈 본문 대응
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * 공통 봉투(envelope)를 처리하는 기본 요청 함수.
 * success 시 `data`만 반환하고, 실패 시 ApiError를 throw 한다.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (MOCK_ENABLED) {
    return mockRequest<T>(
      path,
      options.method ?? "GET",
      options.body,
      options.query,
    );
  }
  const res = await rawFetch(path, options);
  const json = (await parseJson(res)) as ApiResponse<T> | null;

  if (!res.ok || !json || json.success === false) {
    throw normalizeApiError(json, res.status);
  }

  return json.data;
}

/**
 * 봉투를 적용하지 않는 raw 요청 (예: GET /health).
 * 응답 본문을 그대로 T로 반환한다.
 */
export async function requestRaw<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (MOCK_ENABLED) {
    return mockRequest<T>(
      path,
      options.method ?? "GET",
      options.body,
      options.query,
    );
  }
  const res = await rawFetch(path, options);
  const json = await parseJson(res);

  if (!res.ok) {
    throw normalizeApiError(json, res.status);
  }

  return json as T;
}

/** 편의 메서드 */
export const http = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "POST", body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "PUT", body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "PATCH", body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: "DELETE", signal }),
};
