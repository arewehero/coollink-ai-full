from __future__ import annotations

import json
import pathlib
import unittest

from app.schemas.ai import DailyPlanCopyAIResponse, LifestyleAnalysisAIResponse
from app.services.ai_prompts import (
    LIFESTYLE_TYPES,
    build_daily_plan_messages,
    build_lifestyle_messages,
)
from app.services.ai_upstage import UpstageAIClient, _extract_json

FIXTURES = pathlib.Path(__file__).parent / "fixtures"


def load_fixture(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def client_with_replies(replies):
    """_call이 replies를 순서대로 반환하도록 패치(네트워크 호출 없음)."""
    client = UpstageAIClient(api_key="test-key")
    queue = list(replies)

    def fake_call(messages):
        return queue.pop(0) if queue else None

    client._call = fake_call  # type: ignore[method-assign]
    return client


class ExtractJsonTests(unittest.TestCase):
    def test_plain_json(self):
        self.assertEqual(_extract_json('{"a": 1}'), {"a": 1})

    def test_codeblock(self):
        self.assertEqual(_extract_json('```json\n{"a": 1}\n```'), {"a": 1})

    def test_surrounding_text(self):
        self.assertEqual(_extract_json('결과: {"a": 1} 입니다'), {"a": 1})

    def test_invalid(self):
        self.assertIsNone(_extract_json("not json"))
        self.assertIsNone(_extract_json(""))


class FixtureContractTests(unittest.TestCase):
    """mock fixture가 백엔드 스키마 계약을 만족하는지(§4 mock fixture)."""

    def test_lifestyle_output_fixture_matches_schema(self):
        model = LifestyleAnalysisAIResponse.model_validate(
            load_fixture("lifestyle_analysis_output.json")
        )
        self.assertEqual(model.primary_type, "야간 활동형")
        self.assertGreaterEqual(model.confidence, 0)
        self.assertLessEqual(model.confidence, 1)

    def test_daily_plan_output_fixture_matches_schema(self):
        model = DailyPlanCopyAIResponse.model_validate(
            load_fixture("daily_plan_copy_output.json")
        )
        self.assertEqual({a.candidate_id for a in model.actions}, {"cand_001", "cand_002"})


class UpstageLifestyleTests(unittest.TestCase):
    def setUp(self):
        self.input = load_fixture("lifestyle_analysis_input.json")

    def test_valid_response(self):
        reply = json.dumps(load_fixture("lifestyle_analysis_output.json"), ensure_ascii=False)
        result = client_with_replies([reply]).analyze_lifestyle(self.input)
        self.assertEqual(result.primary_type, "야간 활동형")
        self.assertEqual(result.secondary_type, "절약 우선형")

    def test_repair_then_valid(self):
        broken = '{"primary_type": "야간 활동형", "confidence": 0.8, summary: "x"'  # 깨진 JSON
        fixed = json.dumps(
            {
                "primary_type": "야간 활동형",
                "secondary_type": None,
                "confidence": 0.8,
                "summary": "요약",
                "reason": "근거",
            },
            ensure_ascii=False,
        )
        result = client_with_replies([broken, fixed]).analyze_lifestyle(self.input)
        self.assertEqual(result.primary_type, "야간 활동형")

    def test_persistent_failure_falls_back(self):
        # 호출/repair 모두 실패 → 결정론적 fallback (유효 유형 + 문구 보장)
        result = client_with_replies(["쓰레기", "또 쓰레기"]).analyze_lifestyle(self.input)
        self.assertIn(result.primary_type, LIFESTYLE_TYPES)
        self.assertTrue(result.summary)
        self.assertTrue(result.reason)

    def test_no_api_key_falls_back(self):
        result = UpstageAIClient(api_key="").analyze_lifestyle(self.input)
        self.assertIn(result.primary_type, LIFESTYLE_TYPES)

    def test_fallback_deterministic_for_clear_night_score(self):
        # night_score가 단독 최고면 fallback은 항상 '야간 활동형'
        data = dict(self.input)
        data["scores"] = {"night_score": 90, "morning_score": 1}
        result = UpstageAIClient(api_key="").analyze_lifestyle(data)
        self.assertEqual(result.primary_type, "야간 활동형")


class UpstageDailyPlanTests(unittest.TestCase):
    def setUp(self):
        self.input = load_fixture("daily_plan_copy_input.json")

    def test_valid_response_matches_candidate_ids(self):
        reply = json.dumps(load_fixture("daily_plan_copy_output.json"), ensure_ascii=False)
        result = client_with_replies([reply]).generate_daily_plan_copy(self.input)
        self.assertEqual([a.candidate_id for a in result.actions], ["cand_001", "cand_002"])

    def test_no_savings_values_in_output(self):
        reply = json.dumps(load_fixture("daily_plan_copy_output.json"), ensure_ascii=False)
        dumped = client_with_replies([reply]).generate_daily_plan_copy(self.input).model_dump()
        self.assertNotIn("estimated_saving_krw", dumped["actions"][0])
        self.assertNotIn("estimated_co2_reduction_kg", dumped["actions"][0])

    def test_wrong_candidate_id_falls_back(self):
        bad = json.dumps(
            {
                "cheer_message": "x",
                "actions": [{"candidate_id": "WRONG", "title": "t", "action": "a", "reason": "r"}],
            },
            ensure_ascii=False,
        )
        result = client_with_replies([bad, bad]).generate_daily_plan_copy(self.input)
        self.assertEqual([a.candidate_id for a in result.actions], ["cand_001", "cand_002"])


class PromptTests(unittest.TestCase):
    def test_lifestyle_prompt_has_system_rules(self):
        msgs = build_lifestyle_messages(load_fixture("lifestyle_analysis_input.json"))
        self.assertEqual(msgs[0]["role"], "system")
        self.assertIn("입력으로 제공된 값만 사용", msgs[0]["content"])

    def test_daily_plan_prompt_hides_money_when_no_totals(self):
        user = build_daily_plan_messages(load_fixture("daily_plan_copy_input.json"))[1]["content"]
        self.assertIn("daily_totals가 없으므로", user)
        self.assertNotIn("estimated_saving_krw", user)  # 후보 금액 미노출

    def test_daily_plan_prompt_uses_totals_when_present(self):
        data = load_fixture("daily_plan_copy_input.json")
        data["daily_totals"] = {
            "total_estimated_saving_krw": 370,
            "monthly_estimated_saving_krw": 11100,
            "total_energy_saving_kwh": 0.74,
            "total_co2_reduction_kg": 0.35,
        }
        user = build_daily_plan_messages(data)[1]["content"]
        self.assertIn("daily_totals 값", user)


if __name__ == "__main__":
    unittest.main()
