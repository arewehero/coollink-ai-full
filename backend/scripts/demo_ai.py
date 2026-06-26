"""AI 담당분 수동 점검 스크립트.

실행:
    cd ~/해커톤/coollint-ai-api
    .venv/bin/python scripts/demo_ai.py

.env의 AI_PROVIDER(upstage/mock/fallback)에 따라 동작한다.
upstage면 실제 Upstage Solar 호출, 실패 시 자동 fallback.
"""
from __future__ import annotations

import json
import pathlib
import sys
import time

# 레포 루트를 import 경로에 추가(scripts/ 하위에서 실행해도 app 패키지 인식)
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.core.config import settings  # noqa: E402
from app.services.ai_client import get_ai_client  # noqa: E402

FIXTURES = ROOT / "tests" / "fixtures"


def main() -> None:
    print(
        f"provider={settings.ai_provider} | model={settings.upstage_model} | "
        f"key_set={bool(settings.upstage_api_key)} | timeout={settings.ai_timeout_seconds}s"
    )
    client = get_ai_client()
    print("client:", type(client).__name__)

    lifestyle_input = json.loads((FIXTURES / "lifestyle_analysis_input.json").read_text(encoding="utf-8"))
    daily_plan_input = json.loads((FIXTURES / "daily_plan_copy_input.json").read_text(encoding="utf-8"))

    started = time.time()
    r1 = client.analyze_lifestyle(lifestyle_input)
    print(f"\n=== lifestyle-analysis ({time.time() - started:.2f}s) ===")
    print(f"primary={r1.primary_type} | secondary={r1.secondary_type} | confidence={r1.confidence}")
    print("summary:", r1.summary)
    print("reason :", r1.reason)

    started = time.time()
    r2 = client.generate_daily_plan_copy(daily_plan_input)
    print(f"\n=== daily-plan-copy ({time.time() - started:.2f}s) ===")
    print("cheer_message:", r2.cheer_message)
    for action in r2.actions:
        print(f"- [{action.candidate_id}] {action.title}")
        print(f"    action: {action.action}")
        print(f"    reason: {action.reason}")


if __name__ == "__main__":
    main()
