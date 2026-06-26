"""데모 e2e용 DB 테이블 생성 스크립트 (마이그레이션 우회).

⚠️ 통합본 alembic 마이그레이션(0001/0002)에는
   users / user_profiles / home_environments / lifestyle_inputs
   4개 테이블 생성이 누락돼 있어 `alembic upgrade head`가 FK 에러로 실패한다.
   (정식 해결은 백엔드 팀의 마이그레이션 보완 — 이 스크립트는 데모용 임시 우회)

모델 메타데이터로 전체 테이블을 의존성 순서대로 생성한다.

실행:
    cd ~/해커톤/coollink-ai-full/backend
    .venv/bin/python scripts/init_db.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from app.db.base import Base  # noqa: E402
import app.models  # noqa: E402,F401  (모든 모델을 Base.metadata에 등록)
from app.db.session import get_engine  # noqa: E402


def main() -> None:
    engine = get_engine()
    Base.metadata.create_all(engine)
    print("created tables:")
    for name in sorted(Base.metadata.tables.keys()):
        print(f"  - {name}")


if __name__ == "__main__":
    main()
