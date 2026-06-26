# CoolLink AI API

탄소중립 및 전기요금 절약 행동 추천 FastAPI 백엔드입니다.

현재 AI 담당자 코드가 아직 없으므로 `AI_PROVIDER=mock` 기준의
`MockAIClient`/`FallbackAIClient`로 생활유형 분석과 추천 문구 생성을
대체합니다. AWS Bedrock 실제 호출은 포함하지 않습니다.

## Tech Stack

- FastAPI
- Python
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- pytest
- Mock AI Gateway

## Setup & Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Swagger:

- http://localhost:8000/docs

## Google OAuth

Google Cloud Console의 OAuth Redirect URI에는 아래 값을 등록합니다.

```text
http://localhost:8000/api/v1/auth/google/callback
```

필요한 환경변수:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3100
JWT_SECRET=change_me_to_a_long_random_secret
CORS_ALLOWED_ORIGINS=http://localhost:3100
```

프론트 스플래시 화면의 Google 로그인/회원가입 버튼은 아래 URL로 이동시키면 됩니다.

```text
http://localhost:8000/api/v1/auth/google/login
```

인증 성공 시 백엔드는 `FRONTEND_URL` 기준으로 아래 형식으로 리다이렉트합니다.

```text
http://localhost:3100/auth/callback?token={accessToken}
```

인증 실패 시에는 아래 형식으로 리다이렉트합니다.

```text
http://localhost:3100/auth/callback?error=google_auth_failed
```

## AI Gateway

```env
AI_PROVIDER=mock
AI_TIMEOUT_SECONDS=8
AI_LOG_PAYLOAD=false
```

- `MockAIClient` returns deterministic mock lifestyle analysis and action copy.
- `FallbackAIClient` returns template-based copy when AI output is invalid or
  unavailable.
- AI responses are validated with Pydantic schemas in `app/schemas/ai.py`.
- AI-generated copy never creates or changes saving, kWh, or CO2 values.

Run lightweight tests with:

```bash
python -m pytest -q
```

## Major APIs

- `GET /health`
- `PUT /api/v1/profile` (shared user/profile domain dependency)
- `GET /api/v1/auth/google/login`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/user/me`
- `POST /api/v1/ai/lifestyle-analysis`
- `POST /api/v1/recommendations/daily`
- `GET /api/v1/recommendations/daily`
- `PATCH /api/v1/recommendations/actions/{action_id}`
- `GET /api/v1/savings/summary`
- `GET /api/v1/savings/calendar`
- `POST /api/v1/internal/jobs/generate-daily-recommendations`

## Notes

- The migration creates the `users` table used by Google OAuth and the
  recommendation domain foreign keys.
- No AWS Bedrock, SMS, Kakao, admin, vulnerable-group, or health-info code is
  included in this phase.
