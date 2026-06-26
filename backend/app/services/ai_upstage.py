"""실제 LLM 호출 클라이언트 (Upstage Solar). AIClient Protocol 구현.

명세서 §10.6 비기능 요건:
- timeout 8초(settings.ai_timeout_seconds)
- JSON 파싱/스키마 실패 시 1회 repair → 그래도 실패하면 결정론적 fallback
- 금액/CO2 hallucination 0 (프롬프트에서 금액 노출 차단 + daily_totals만 사용)

추후 AWS Bedrock으로 교체할 때는 `_call()`만 Bedrock 호출로 바꾸면 된다
(프롬프트/검증/fallback 오케스트레이션은 동일).
"""
from __future__ import annotations

import json
from typing import Any, Callable, Dict, List, Optional

import httpx

from app.core.config import settings
from app.schemas.ai import DailyPlanCopyAIResponse, LifestyleAnalysisAIResponse
from app.services.ai_prompts import (
    build_daily_plan_messages,
    build_lifestyle_messages,
    build_repair_messages,
)
from app.services.ai_validation import (
    AIResponseValidationError,
    build_fallback_daily_plan_copy,
    build_fallback_lifestyle_analysis,
    validate_daily_plan_copy_response,
    validate_lifestyle_analysis_response,
)


class UpstageAIClient:
    """Upstage Solar 기반 AIClient 구현체."""

    provider = "upstage"

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        prompt_version: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
    ) -> None:
        self._api_key = api_key if api_key is not None else settings.upstage_api_key
        self._base_url = (base_url or settings.upstage_base_url).rstrip("/")
        self.model_name = model or settings.upstage_model
        self.prompt_version = prompt_version or settings.ai_prompt_version
        self.timeout_seconds = timeout_seconds or settings.ai_timeout_seconds

    # ---------- AIClient Protocol ----------
    def analyze_lifestyle(self, input_data: Dict[str, Any]) -> LifestyleAnalysisAIResponse:
        return self._run(
            messages=build_lifestyle_messages(input_data),
            validate=lambda raw: validate_lifestyle_analysis_response(raw),
            fallback=lambda: build_fallback_lifestyle_analysis(input_data),
        )

    def generate_daily_plan_copy(self, input_data: Dict[str, Any]) -> DailyPlanCopyAIResponse:
        return self._run(
            messages=build_daily_plan_messages(input_data),
            validate=lambda raw: validate_daily_plan_copy_response(raw, input_data),
            fallback=lambda: build_fallback_daily_plan_copy(input_data),
        )

    # ---------- 오케스트레이션 ----------
    def _run(
        self,
        *,
        messages: List[Dict[str, str]],
        validate: Callable[[Any], Any],
        fallback: Callable[[], Any],
    ):
        """호출 → 파싱 → 검증. 실패 시 1회 repair. 그래도 실패하면 fallback."""
        text = self._call(messages)
        if text is not None:
            raw = _extract_json(text)
            if raw is not None:
                try:
                    return validate(raw)
                except AIResponseValidationError:
                    pass
            # 1회 repair (JSON 파싱 실패 또는 스키마 검증 실패 모두 대상)
            repaired = self._call(build_repair_messages(text))
            if repaired is not None:
                raw_repaired = _extract_json(repaired)
                if raw_repaired is not None:
                    try:
                        return validate(raw_repaired)
                    except AIResponseValidationError:
                        pass
        return fallback()

    def _call(self, messages: List[Dict[str, str]]) -> Optional[str]:
        """LLM 호출. 실패(키 없음/네트워크/타임아웃/형식 오류) 시 None."""
        if not self._api_key:
            return None
        try:
            response = httpx.post(
                f"{self._base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "temperature": 0.3,
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError):
            return None


def _extract_json(text: Optional[str]) -> Optional[Any]:
    """LLM 출력 텍스트에서 JSON 객체를 추출(코드블록/앞뒤 잡텍스트 제거)."""
    if not text:
        return None
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped[:4].lower() == "json":
            stripped = stripped[4:]
        stripped = stripped.strip()
    start, end = stripped.find("{"), stripped.rfind("}")
    if 0 <= start < end:
        stripped = stripped[start : end + 1]
    try:
        return json.loads(stripped)
    except (json.JSONDecodeError, ValueError):
        return None
