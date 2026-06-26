"""pytest 공통 설정.

테스트 격리: `.env`의 AI_PROVIDER가 upstage/bedrock이어도,
테스트는 항상 mock/결정론 클라이언트로 동작해 실제 LLM(네트워크)을 호출하지 않는다.
(실제 Upstage 호출 점검은 scripts/demo_ai.py 로 별도 수행)
"""
import os

os.environ["AI_PROVIDER"] = "mock"
os.environ["AI_TIMEOUT_SECONDS"] = "8"  # 테스트는 기본 timeout(8) 가정 — .env의 운영값(20)과 격리
