"""CoolLink AI 프롬프트 (명세서 §11).

출력 형식은 백엔드 평탄 스키마(app/schemas/ai.py: LifestyleAnalysisAIResponse,
DailyPlanCopyAIResponse)에 맞춘다.

금액 hallucination 방지(§10.6):
- daily_plan 프롬프트에는 후보의 estimated_* 금액 필드를 노출하지 않는다.
- cheer_message의 금액은 daily_totals가 있을 때만 사용하고, 없으면 금액을 쓰지 않게 지시한다.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List

# 명세 §10.1/§10.2 prompt_version
PROMPT_VERSION_LIFESTYLE = "lifestyle-v1"
PROMPT_VERSION_DAILY_PLAN = "daily-plan-v1"

# 명세 §5.4 LifestyleType 8종
LIFESTYLE_TYPES = [
    "아침형", "낮 활동형", "재택 체류형", "야간 활동형",
    "불규칙형", "외출 중심형", "냉방 고위험형", "절약 우선형",
]

# 명세 §11.1 공통 System Prompt (8규칙)
SYSTEM_PROMPT = (
    "너는 CoolLink AI의 탄소중립 절약 코치다.\n"
    "사용자의 집 환경, 생활패턴, 냉난방 정보, 월 전기요금, 시간대별 날씨를 바탕으로\n"
    "사용자가 오늘 실천할 수 있는 전기요금 절약 행동을 이해하기 쉽게 설명한다.\n\n"
    "반드시 지켜야 할 규칙:\n"
    "1. 절약액, 전력 절감량, CO2 감축량은 입력으로 제공된 값만 사용한다.\n"
    "2. 이 값들을 새로 계산하거나 추정하지 않는다.\n"
    "3. 입력에 없는 집 구조, 생활패턴, 건강 상태, 가족 구성, 지역 정보를 만들지 않는다.\n"
    "4. 선택한 생활패턴 하나만 보지 말고 전체 입력과 점수를 조합한다.\n"
    "5. 폭염/고온에서는 무리한 절약보다 안전한 냉방을 우선한다.\n"
    "6. 사용자를 비난하지 않고 응원하는 말투를 쓴다.\n"
    "7. 결과는 반드시 유효한 JSON으로만 반환한다.\n"
    "8. 마크다운/설명문/코드블록 없이 JSON 객체만 반환한다."
)


def _dump(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, default=str)


def build_lifestyle_messages(input_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """생활 유형 판단 프롬프트 (명세 §11.2 lifestyle-v1)."""
    types = " / ".join(LIFESTYLE_TYPES)
    user = (
        "[작업] 아래 입력으로 사용자의 생활 유형을 판단한다.\n\n"
        f"[판단 가능한 생활 유형 8종] {types}\n"
        "- primary_type: 활동/체류 패턴을 가장 잘 나타내는 유형 1개 (위 8종 중 하나).\n"
        "- secondary_type: 절약/외출/냉방위험 성향 유형 1개, 없으면 null.\n"
        "- confidence: 0.0~1.0 사이 숫자.\n"
        "- summary: 사용자에게 보여줄 한 줄 요약, 200자 이하.\n"
        "- reason: 점수와 입력 조합 근거, 300자 이하.\n"
        "- 위 8종 외의 유형명을 만들지 않는다.\n\n"
        "[출력 JSON 형식]\n"
        '{"primary_type":"<유형>","secondary_type":"<유형 또는 null>",'
        '"confidence":0.0,"summary":"...","reason":"..."}\n\n'
        f"[입력]\n{_dump(input_data)}"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def _slim_candidates(input_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """후보에서 금액 필드를 제거 → AI가 숫자를 만들거나 바꿀 여지를 차단(§10.6)."""
    slimmed: List[Dict[str, Any]] = []
    for candidate in input_data.get("candidate_actions", []) or []:
        if not isinstance(candidate, dict):
            continue
        slimmed.append(
            {
                "candidate_id": candidate.get("candidate_id"),
                "time_range": candidate.get("time_range"),
                "action_type": candidate.get("action_type"),
                "difficulty": candidate.get("difficulty"),
                "evidence": candidate.get("evidence", []),
                "backend_hint": candidate.get("backend_hint"),
            }
        )
    return slimmed


def build_daily_plan_messages(input_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """추천 문구 생성 프롬프트 (명세 §11.3 daily-plan-v1)."""
    daily_totals = input_data.get("daily_totals")
    if daily_totals:
        money_rule = (
            "- cheer_message에서 금액을 언급할 때는 입력 daily_totals 값"
            "(total_estimated_saving_krw, monthly_estimated_saving_krw)만 그대로 사용한다."
        )
    else:
        money_rule = (
            "- 입력에 daily_totals가 없으므로 cheer_message에 금액·숫자(원/kWh/kg)를 쓰지 않는다."
        )

    slim_input = {
        "lifestyle_analysis": input_data.get("lifestyle_analysis"),
        "home_environment": input_data.get("home_environment"),
        "weather_by_time": input_data.get("weather_by_time", []),
        "daily_totals": daily_totals,
        "candidate_actions": _slim_candidates(input_data),
    }
    user = (
        "[작업] 각 candidate_action에 사용자 친화적인 title/action/reason을 붙이고, "
        "하루 응원 메시지(cheer_message)를 작성한다.\n\n"
        "[규칙]\n"
        "- candidate_actions에 있는 candidate_id만 사용한다. 새 행동을 추가하거나 candidate_id를 바꾸지 않는다.\n"
        "- 모든 candidate_id에 대해 정확히 하나씩 문구를 만든다.\n"
        "- title: 30자 이하, 행동 중심 동사형(예 '아침 환기로 냉방 시작 늦추기'). '절약하세요' 같은 추상 표현 금지.\n"
        "- action: 120자 이하, 실제로 따라 할 수 있는 구체적 행동.\n"
        "- reason: 200자 이하, 해당 후보의 evidence를 최소 2개 연결한다. 입력에 없는 집구조/건강/금액 언급 금지.\n"
        "- cheer_message: 250자 이하, 응원하는 말투.\n"
        f"{money_rule}\n"
        "- 폭염/고온(heat_alert=true)에서는 에어컨 끄기를 권하지 않는다. "
        "'무리하게 참지 마세요'는 허용하고 차광·선풍기·타이머 등 안전한 절약만 권한다.\n\n"
        "[출력 JSON 형식]\n"
        '{"cheer_message":"...","actions":[{"candidate_id":"...","title":"...","action":"...","reason":"..."}]}\n\n'
        f"[입력]\n{_dump(slim_input)}"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def build_repair_messages(broken_text: str) -> List[Dict[str, str]]:
    """JSON Repair 프롬프트 (명세 §11.4, 1회만 사용)."""
    user = (
        "[작업] 아래 텍스트는 JSON으로 파싱하려 했으나 실패했다. "
        "의미를 바꾸지 말고 유효한 JSON 객체로만 고쳐라.\n"
        '- 누락된 필드는 빈 문자열("") 또는 null로 채운다.\n'
        "- 마크다운/설명/코드블록 없이 JSON 객체만 반환한다.\n\n"
        f"[원본]\n{broken_text}"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]
