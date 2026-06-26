# CoolLink AI AWS 활용 계획

## 1. 현재 프로젝트 요약

CoolLink AI는 사용자의 집 환경, 생활패턴, 시간대별 날씨, 월 전기요금을 바탕으로 오늘 실천할 수 있는 전기요금 절약 행동을 추천하고, 예상 절약액, kWh, CO2 감축량을 보여주는 탄소중립 AI 추천 서비스다.

현재 로컬 레포 기준 구조는 다음과 같다.

| 영역 | 현재 코드 구조 | 관찰 내용 |
|---|---|---|
| Frontend | `src/app`, `src/features`, `src/components`, `src/lib/api`, `src/lib/mock` | Next.js App Router 기반. `NEXT_PUBLIC_ENABLE_MOCK=true`일 때 백엔드 없이 확인 가능하다. |
| Backend | `backend/app`, `backend/alembic`, `backend/tests` | FastAPI, SQLAlchemy/Alembic, 추천/AI/절약 요약 라우터와 mock AI client 구조가 있다. 현재 `backend/`는 로컬 작업트리에 untracked 상태다. |
| AI | `backend/app/services/ai_client.py`, `ai_validation.py`, `ai_logging.py` | `AI_PROVIDER=mock/fallback` 구조가 있어 Bedrock client로 교체하기 좋다. AI 실패 시 fallback을 유지하는 방향이 명세와 맞다. |
| Database | `backend/app/models/recommendation.py`, `backend/alembic/versions/...` | 추천 도메인 테이블과 migration 초안이 있다. 운영은 PostgreSQL 기준이므로 RDS PostgreSQL로 전환한다. |
| Docs/Artifacts | `README.md`, `artifacts/`, `screenshots/`, `scripts/capture-pdf.ts` | 화면 공유용 PDF 생성 도구가 있고, 발표 자료 자산은 S3 저장 후보가 될 수 있다. |

현재 프론트 환경변수는 `.env.example`에 `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_DEFAULT_REGION`, `NEXT_PUBLIC_ENABLE_MOCK`가 정리되어 있다.

## 2. 현재 명세 기준 클라우드 요구사항

API 명세 기준 클라우드 요구사항은 다음과 같다.

| 요구 영역 | 명세 기준 | AWS 설계 반영 |
|---|---|---|
| API 서버 | FastAPI, Docker, `/api/v1`, 공통 `success/data/meta/error` 응답 | EC2 또는 ECS에서 FastAPI 컨테이너 실행 |
| Frontend | Next.js, FastAPI REST API 연동, 운영 `NEXT_PUBLIC_API_BASE_URL` | MVP는 EC2 Docker Compose에서 같이 실행, 확장은 Amplify Hosting 또는 CloudFront |
| DB | PostgreSQL, SQLAlchemy 2.x, Alembic | RDS PostgreSQL, migration은 배포 시 `alembic upgrade head` |
| AI | AWS Bedrock, JSON Schema 검증, fallback, AI 로그 | Bedrock Runtime 호출, 실패 시 fallback, `ai_generation_logs`와 CloudWatch 기록 |
| Weather | OpenWeatherMap 우선, API 실패 시 cache/fallback | 외부 호출 latency 기록 |
| Scheduler | APScheduler 또는 EventBridge + 내부 Job API | MVP는 EventBridge schedule로 내부 Job API 호출 권장 |
| 관측성 | request_id, API latency, AI latency, success/fail/error_code | CloudWatch Logs, metric filter 또는 간단한 structured log |
| 저장소 | S3는 추후 리포트 저장용으로 준비 | MVP 선택, 발표에서는 월간 리포트 PDF/AI 샘플/정적 자산 저장소로 설명 |
| 배포 | EC2 + Docker, 운영 환경변수 분리 | EC2 Docker Compose 중심으로 빠르게 배포 |

AI 명세에서 가장 중요한 원칙은 다음이다.

- AI는 생활 유형 판단과 사용자 문구 생성만 담당한다.
- 절약액, 전력 절감량, CO2 감축량은 백엔드 계산 결과만 사용한다.
- AI 응답은 JSON Schema 검증을 통과해야 저장한다.
- JSON 파싱 실패는 1회 repair 후 fallback한다.
- AI 로그는 기본적으로 prompt version, input hash, latency, success/fail, error_code 중심으로 남기고 원문 저장은 기본 비활성화한다.

## 3. AWS 서비스별 역할 매핑 표

| 서비스명 | 사용 목적 | CoolLink AI에서 맡는 역할 | MVP 필수 여부 | 발표 어필 포인트 |
|---|---|---|---|---|
| EC2 | 서버 실행 | Docker Compose로 Next.js, FastAPI, reverse proxy 실행 | 필수 | 가장 빠르게 실제 AWS 배포를 보여줄 수 있음 |
| RDS PostgreSQL | 관리형 DB | users, profile, weather cache, recommendation plans/actions, saving summaries, ai_generation_logs 저장 | 권장 필수 | 로컬 DB가 아닌 관리형 PostgreSQL 사용, migration 기반 운영 |
| S3 | 객체 저장소 | 월간 리포트 PDF, 화면 공유 PDF, AI 로그 샘플, 향후 정적 리소스 저장 | MVP 선택 | 탄소중립 리포트/PDF 아카이브와 데이터 자산 관리로 설명 가능 |
| AWS Bedrock | AI 모델 호출 | 생활 유형 판단, 추천 카드 문구, 응원 메시지 생성 | 권장 필수 | 대회 핵심 AWS AI 활용 포인트 |
| CloudWatch Logs | 로그/모니터링 | FastAPI access log, AI latency/success/error_code, 추천 생성 결과 로그 수집 | 권장 필수 | 실패해도 추적 가능한 AI 서비스라는 점 강조 |
| EventBridge | 스케줄링 | 매일 오전 6시 `/api/v1/internal/jobs/generate-daily-recommendations` 호출 | 권장 | 서버 내부 cron보다 AWS-native 스케줄링으로 설명하기 좋음 |
| CloudFront | CDN/HTTPS/캐싱 | Next.js 정적 자산, S3 리포트 다운로드, API 앞단 캐싱 후보 | 추후 | 속도와 HTTPS, 전역 배포 스토리 |
| ACM | TLS 인증서 | HTTPS 도메인 인증서 발급 | 선택 | 운영 HTTPS 필수 요구사항 충족 |
| Route 53 | DNS | `api.coollink...`, `app.coollink...` 도메인 연결 | 선택 | 발표 데모 URL 품질 향상 |
| ALB | 로드밸런서 | EC2/ECS 앞단 HTTPS termination, health check | 추후 | 운영형 구성으로 확장 가능 |
| ECR | 컨테이너 이미지 저장 | frontend/backend Docker image 저장 | 추후 | CI/CD와 ECS 전환 기반 |
| ECS Fargate | 서버리스 컨테이너 | Next.js/FastAPI 컨테이너 운영 | 추후 | 운영 확장성과 관리 부담 감소 |
| Amplify Hosting | 프론트 호스팅 | Next.js 프론트 분리 배포 | 선택/추후 | FE 배포 자동화, preview branch |
| CloudWatch Alarms | 알림 | API 5xx, AI failure rate, scheduler failure 알림 | 추후 | 운영 신뢰성 어필 |

## 4. 추천 아키텍처 3안

### 1안: 가장 빠른 EC2 + Docker Compose 구성

구성:

- EC2 1대
- Docker Compose로 `frontend`, `backend`, `nginx` 실행
- DB는 초기에는 EC2 내부 PostgreSQL 또는 RDS PostgreSQL
- AI는 초기 `AI_PROVIDER=mock/fallback`, 발표 직전 `AI_PROVIDER=bedrock` 전환
- 로그는 일단 Docker log, 가능하면 CloudWatch Agent로 전송

장점:

- 현재 로컬 구조와 가장 잘 맞고 구현 속도가 빠르다.
- Dockerfile과 `docker-compose.prod.yml`만 있으면 배포가 단순하다.
- 장애 원인이 적고 발표 전 리스크가 낮다.

단점:

- RDS/Bedrock/EventBridge/CloudWatch를 붙이지 않으면 “EC2에 올렸다” 수준으로 보일 수 있다.
- EC2 내부 DB를 쓰면 데이터 운영 스토리가 약하다.

추천 사용 시점:

- 발표까지 시간이 매우 짧고, 우선 실제 URL 데모가 필요할 때.

### 2안: AWS 대회 어필 강화 구성

구성:

- EC2 1대에서 Docker Compose로 Next.js + FastAPI + Nginx 실행
- RDS PostgreSQL 연결
- Bedrock Runtime으로 생활 유형 판단/추천 문구 생성
- EventBridge가 매일 오전 6시 내부 Job API 호출
- CloudWatch Logs로 API/AI/스케줄러 로그 수집
- S3는 월간 리포트 PDF, 발표용 화면 PDF, 향후 AI 샘플 저장소로 준비

장점:

- 구현 난이도는 아직 EC2 중심이라 낮다.
- Bedrock, RDS, S3, EventBridge, CloudWatch의 역할이 명확해 발표용 아키텍처가 좋다.
- “AI가 계산하지 않고 백엔드 계산값을 설명한다”는 신뢰 구조를 AWS Bedrock과 함께 어필할 수 있다.

단점:

- RDS/EventBridge 설정 시간이 필요하다.
- HTTPS/도메인까지 붙이면 운영 작업량이 늘어난다.

추천 사용 시점:

- 이번 대회 제출용 최종 권장안.

### 3안: 확장형 운영 구성

구성:

- Frontend: Amplify Hosting 또는 S3 + CloudFront
- Backend: ECS Fargate + ALB
- Image: ECR
- DB: RDS PostgreSQL
- Scheduler: EventBridge Scheduler + Lambda 또는 ECS task/API 호출
- Observability: CloudWatch Logs, CloudWatch Metrics/Alarms, X-Ray 선택
- CI/CD: GitHub Actions -> ECR -> ECS deploy 또는 Amplify auto deploy

장점:

- 운영 확장성과 배포 자동화가 가장 좋다.
- 프론트/백엔드 독립 배포와 무중단 롤링 배포가 가능하다.

단점:

- 발표 전 구현 시간이 많이 든다.
- ALB, ECS task definition, image build pipeline 등 변수가 많다.

추천 사용 시점:

- 대회 이후 실제 서비스 운영 또는 후속 고도화 단계.

## 5. 최종 추천안

최종 추천은 **2안: EC2 + Docker Compose 기반 AWS 대회 어필 강화 구성**이다.

선택 이유:

- 현재 레포는 Next.js 프론트와 FastAPI 백엔드가 한 저장소에 있고, Docker Compose 배포와 잘 맞는다.
- 대회 발표 전까지 ECS/ALB/CloudFront 전체 운영형 구성을 끝내기보다, EC2 중심으로 안정적인 데모를 확보하는 편이 안전하다.
- 동시에 RDS PostgreSQL, Bedrock, S3, EventBridge, CloudWatch를 붙이면 AWS 활용이 충분히 선명하다.
- Bedrock은 AI 핵심, RDS는 추천/체크/요약 데이터, EventBridge는 매일 오전 추천 생성, CloudWatch는 관측성, S3는 리포트/발표 자산 저장이라는 역할 분담이 발표 다이어그램에 잘 드러난다.

현실적인 MVP 최종 형태:

```text
EC2 Docker Compose
  - Nginx reverse proxy
  - Next.js frontend
  - FastAPI backend

AWS managed services
  - RDS PostgreSQL
  - Bedrock
  - EventBridge
  - CloudWatch Logs
  - S3 optional
```

발표용 메시지:

> CoolLink AI는 AWS Bedrock으로 생활 유형과 실천 문구를 생성하고, 백엔드 계산 엔진이 절약액/kWh/CO2를 책임지며, RDS PostgreSQL에 추천/체크/요약 이력을 저장하는 탄소중립 AI 추천 서비스입니다. EventBridge가 매일 오전 추천 생성을 트리거하고, CloudWatch가 API와 AI 성공/실패를 관측합니다.

## 6. DB 선택

### 왜 RDS PostgreSQL인지

- 명세서의 Database가 PostgreSQL로 고정되어 있다.
- SQLAlchemy 2.x, Alembic migration 구조와 자연스럽게 연결된다.
- `recommendation_plans(user_id, date)` unique, `lifestyle_analysis(user_id, date)` unique, action index 등 관계형 제약이 중요하다.
- 추천 플랜, 행동 체크 이력, 절약 요약, AI 로그를 조인/집계하기 쉽다.
- 발표에서 “사용자 행동 이력과 AI 호출 로그를 관리형 DB에 저장한다”는 점이 설득력 있다.

### 로컬 PostgreSQL에서 RDS로 전환할 때 필요한 환경변수

| 변수 | 로컬 예시 | 운영/RDS 예시 |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://user:password@localhost:5432/coollink` | `postgresql+psycopg://coollink_app:${DB_PASSWORD}@coollink-rds.xxxxx.ap-northeast-2.rds.amazonaws.com:5432/coollink` |
| `APP_ENV` | `local` | `production` |

RDS 전환의 핵심은 `DATABASE_URL`을 운영 RDS 엔드포인트로 바꾸고, 배포 전에 Alembic migration을 적용하는 것이다.

### Alembic migration 적용 방식

배포 시 권장 순서:

1. EC2에 backend image 또는 source 배포
2. 운영 환경변수 로드
3. RDS 연결 확인
4. `alembic upgrade head`
5. FastAPI 컨테이너 시작 또는 재시작

초기 MVP에서는 배포 스크립트에서 수동 실행해도 된다. 단, 앱 시작 시 자동 migration은 실패 시 원인 파악이 어려울 수 있어 발표 전에는 명시적 명령으로 실행하는 편이 안전하다.

## 7. 저장소 선택

### S3에 무엇을 저장할지

MVP에서 S3는 필수는 아니지만 발표용으로 의미 있게 설명할 수 있다.

| 저장 대상 | MVP 필요 여부 | 설명 |
|---|---|---|
| 월간 리포트 PDF | 선택 | `/report` 월간 요약을 PDF로 생성해 S3에 저장하는 확장 포인트 |
| 발표용 화면 PDF | 선택 | 현재 `artifacts/CoolLink_AI_FE_화면공유용.pdf` 같은 산출물을 저장 |
| AI 로그 샘플 | 선택 | 원문이 아닌 비식별 샘플, prompt version별 결과 비교 자료 |
| 정적 이미지/리소스 | 선택 | 서비스 소개 이미지, 리포트 썸네일 등 |
| 사용자 업로드 | 추후 | 고지서 OCR 확장 시 원본 이미지 임시 저장 |

### MVP에서는 필수인지 선택인지

S3는 **MVP 기능 필수는 아니다**. 현재 핵심 흐름은 프론트, FastAPI, RDS, Bedrock, EventBridge만으로 구현 가능하다. 다만 대회 발표에서 “월간 리포트 PDF 저장소”, “AI 결과 감사 샘플 저장소”, “향후 데이터 레이크 확장 기반”으로 잡으면 AWS 활용 포인트가 좋아진다.

### 추후 확장 가능성

- 월간 리포트 PDF 생성 후 `s3://coollink-reports/{user_id}/{month}.pdf`
- S3 presigned URL로 사용자 다운로드 제공
- CloudFront를 붙여 리포트 정적 배포
- Athena/Glue 확장 전 단계의 원천 데이터 저장소로 활용

## 8. AI 서비스 선택

### 왜 AWS Bedrock인지

- AWS 대회에서 가장 강하게 어필할 수 있는 AI managed service다.
- FastAPI의 `AIClient` provider를 Bedrock Runtime 구현으로 바꾸면 mock/fallback 구조를 유지하면서 실제 AI 호출로 전환할 수 있다.
- 운영 시 prompt version, input hash, latency, error_code를 남겨 품질과 비용을 관리할 수 있다.
- 현재 코드의 `AIClient` 인터페이스가 mock/fallback과 실제 provider를 분리하고 있어 Bedrock adapter를 추가하기 쉽다.

### 어떤 부분에 Bedrock을 사용할지

| 기능 | Bedrock 사용 여부 | 설명 |
|---|---|---|
| 생활 유형 판단 | 사용 | `primary_type`, `secondary_type`, `confidence`, `summary`, `reason` 생성 |
| 추천 카드 문구 | 사용 | `title`, `action`, `reason`, `cheer_message` 생성 |
| 절약액 계산 | 사용 안 함 | 백엔드 계산 엔진 결과만 사용 |
| 전력량/kWh 계산 | 사용 안 함 | 백엔드 계산 엔진 결과만 사용 |
| CO2 감축량 계산 | 사용 안 함 | 백엔드 계산 엔진 결과만 사용 |
| JSON repair | 선택 | JSON 파싱 실패 시 1회 repair 요청 후 fallback |

### AI가 계산값을 만들지 않는 구조

1. 백엔드가 프로필, 날씨, 계산 기준값으로 후보 행동과 절약 수치를 먼저 계산한다.
2. Bedrock 입력에는 후보 행동의 `candidate_id`, `action_type`, 시간대, 근거, 백엔드 계산값을 전달한다.
3. Bedrock은 문구만 반환한다.
4. 백엔드는 반환된 `candidate_id`가 입력 후보에 있는지 검증한다.
5. 최종 응답의 절약액, kWh, CO2는 백엔드 계산값으로 덮어쓴다.
6. JSON Schema 검증 실패 또는 timeout 시 fallback 템플릿을 사용한다.

### 실패 시 fallback 구조

- Bedrock timeout: fallback 생활 유형/문구 생성
- JSON parsing 실패: 1회 repair 요청 후 실패 시 fallback
- candidate_id 불일치: 해당 추천 제외
- AI가 금액/CO2를 바꾼 경우: 백엔드 계산값으로 덮어쓰기
- AI 로그: `request_type`, `prompt_version`, `input_hash`, `latency_ms`, `success`, `error_code` 저장

## 9. 스케줄링

### EventBridge vs APScheduler 비교

| 항목 | APScheduler | EventBridge |
|---|---|---|
| 구현 속도 | 빠름. FastAPI 프로세스 내부에서 실행 | 설정 필요. AWS console/CLI 또는 IaC |
| 안정성 | 앱 프로세스 재시작/중복 실행에 주의 | AWS 관리형 schedule |
| 발표 어필 | 약함. 서버 내부 cron 느낌 | 강함. AWS-native 자동 추천 생성 |
| 비용 | 거의 없음 | 낮음 |
| 장애 추적 | 앱 로그 중심 | EventBridge invocation + backend log |
| 확장 | 서버가 여러 대면 중복 실행 방지 필요 | 단일 schedule로 관리 쉬움 |

### MVP 추천 방식

MVP 발표용은 **EventBridge schedule -> FastAPI 내부 Job API 호출**을 추천한다.

- Schedule: 매일 오전 6시 KST
- Target: API endpoint 또는 Lambda relay
- Endpoint: `POST /api/v1/internal/jobs/generate-daily-recommendations`

도메인 연결이 늦어지는 경우 임시 대안:

- EC2 내부 crontab 또는 APScheduler를 사용하되, 발표 자료에서는 EventBridge 전환 계획을 P1으로 둔다.
## 10. 모니터링/로그

CloudWatch Logs를 최소 관측성 표준으로 둔다.

### 수집할 로그

| 로그 | 필드 |
|---|---|
| API request log | `request_id`, `method`, `path`, `status_code`, `latency_ms`, `user_id_hash` |
| AI call log | `request_id`, `request_type`, `prompt_version`, `model_name`, `latency_ms`, `success`, `error_code`, `input_hash` |
| Recommendation job log | `date`, `target`, `total_users`, `generated_count`, `skipped_count`, `failed_count` |
| Weather API log | `provider`, `region`, `cache_hit`, `stale`, `latency_ms`, `error_code` |
| Action completion log | `action_id`, `event_type`, `saving_krw_delta`, `created_at` |

### 발표용 모니터링 지표

- API latency p95
- AI latency p95
- AI success/fail/error_code
- 매일 추천 생성 성공/실패 카운트
- fallback 발생 횟수
- 행동 완료 이벤트 수

MVP에서는 CloudWatch metric filter까지 모두 만들 필요는 없다. FastAPI structured log를 CloudWatch Logs에 쌓고, 발표 화면에서 로그 그룹과 `request_id` 검색이 가능하면 충분히 어필된다.

## 11. 환경변수 정리

### 로컬용 `.env`

Backend:

```env
APP_ENV=local
APP_NAME=coollink-api
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/coollink
OPENWEATHER_API_KEY=...
WEATHER_PROVIDER=mock
WEATHER_CACHE_TTL_SECONDS=3600
AI_PROVIDER=mock
AWS_REGION=ap-northeast-2
BEDROCK_MODEL_ID=...
AI_TIMEOUT_SECONDS=8
AI_LOG_PAYLOAD=false
INTERNAL_JOB_TOKEN=change_me
CORS_ALLOWED_ORIGINS=http://localhost:3000
DEFAULT_ELECTRICITY_UNIT_PRICE=150
CO2_FACTOR_KG_PER_KWH=0.4781
TREE_ABSORPTION_KG_PER_YEAR=6.6
```

Frontend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_DEFAULT_REGION=서울
NEXT_PUBLIC_ENABLE_MOCK=true
```

### 운영용 `.env.production` 또는 AWS 환경변수

Backend:

```env
APP_ENV=production
APP_NAME=coollink-api
DATABASE_URL=postgresql+psycopg://coollink_app:password@{rds-endpoint}:5432/coollink
OPENWEATHER_API_KEY=...
WEATHER_PROVIDER=openweathermap
WEATHER_CACHE_TTL_SECONDS=3600
AI_PROVIDER=bedrock
AWS_REGION=ap-northeast-2
BEDROCK_MODEL_ID=...
AI_TIMEOUT_SECONDS=8
AI_LOG_PAYLOAD=false
INTERNAL_JOB_TOKEN=...
CORS_ALLOWED_ORIGINS=https://{frontend-domain}
DEFAULT_ELECTRICITY_UNIT_PRICE=150
CO2_FACTOR_KG_PER_KWH=0.4781
TREE_ABSORPTION_KG_PER_YEAR=6.6
```

Frontend:

```env
NEXT_PUBLIC_API_BASE_URL=https://{api-domain}
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEFAULT_REGION=서울
NEXT_PUBLIC_ENABLE_MOCK=false
```

## 12. 배포 순서

1. RDS PostgreSQL 생성
   - DB name: `coollink`
   - app user 생성

2. EC2 생성
   - Ubuntu LTS 또는 Amazon Linux
   - Docker/Docker Compose 설치

3. 환경변수 등록
   - `DATABASE_URL`, `OPENWEATHER_API_KEY`, `BEDROCK_MODEL_ID`, `INTERNAL_JOB_TOKEN`

4. 코드 배포
   - Git clone 또는 artifact upload
   - `.env.production` 생성

5. Docker image build
   - frontend image
   - backend image
   - nginx image 또는 config mount

6. DB migration
   - `cd backend`
   - `alembic upgrade head`

7. 백엔드 실행
   - FastAPI container start
   - `/health` 확인
   - RDS 연결 확인

8. 프론트 실행
   - `NEXT_PUBLIC_API_BASE_URL` 운영 API로 설정
   - `NEXT_PUBLIC_ENABLE_MOCK=false`
   - `/today`, `/simulator`, `/report` 확인

9. EventBridge schedule 설정
    - 매일 오전 6시 KST
    - 내부 Job API 호출

10. CloudWatch Logs 확인
    - API request log
    - AI call log
    - scheduler job log

11. 도메인 선택 적용
    - 빠른 MVP: EC2 public DNS
    - 발표 품질 향상: Route 53 도메인 연결

## 13. 발표용 한 장 요약

> CoolLink AI는 AWS Bedrock + RDS + S3 + EventBridge + CloudWatch 기반의 탄소중립 AI 추천 서비스입니다.

아키텍처 설명 문장:

> 사용자는 Next.js 앱에서 집 환경과 생활패턴을 입력하고, FastAPI 백엔드는 OpenWeatherMap 날씨와 RDS에 저장된 프로필을 바탕으로 절약액/kWh/CO2를 계산합니다. AWS Bedrock은 계산값을 바꾸지 않고 생활 유형과 실천 문구만 생성하며, EventBridge가 매일 오전 6시 추천 생성을 자동화하고 CloudWatch가 API와 AI 호출 상태를 관측합니다.

AWS 활용 포인트 5개:

1. **Bedrock**: 생활 유형 판단과 추천 문구 생성에 사용. 계산값 hallucination을 막기 위해 백엔드 계산값만 최종 응답에 사용.
2. **RDS PostgreSQL**: 추천 플랜, 행동 체크 이력, 절약 요약, AI 호출 로그를 관리형 DB에 저장.
3. **EventBridge**: 매일 오전 6시 자동 추천 생성 Job을 트리거.
4. **CloudWatch Logs**: API latency, AI latency, AI success/fail/error_code, 추천 생성 결과를 추적.
5. **S3**: 월간 리포트 PDF, 발표용 화면 PDF, 향후 AI 샘플 저장소로 확장.

## 14. 팀원 작업 분담

| 담당 | 작업 |
|---|---|
| 백엔드/DB | RDS 연결, Alembic migration, 추천/체크/요약 API, 공통 응답 포맷 |
| AI/Bedrock | Bedrock client, prompt, JSON Schema 검증, repair/fallback, AI 로그 |
| 프론트/배포 | `NEXT_PUBLIC_API_BASE_URL` 운영 전환, mock off, API 오류 UX, 배포 빌드 검증 |
| 클라우드/운영 | EC2/RDS/EventBridge/CloudWatch/S3 설정, 배포 문서 |

## 15. 지금 당장 해야 할 체크리스트

### P0

- [ ] `backend/` 변경분을 팀 기준 브랜치에 정리하거나 별도 백엔드 레포와 동기화
- [ ] Backend Dockerfile 작성
- [ ] Frontend Dockerfile 작성
- [ ] `docker-compose.prod.yml` 작성
- [ ] RDS PostgreSQL 생성
- [ ] `DATABASE_URL` RDS 기준으로 설정
- [ ] Alembic migration을 RDS에 적용
- [ ] `NEXT_PUBLIC_API_BASE_URL` 운영 API 주소로 설정
- [ ] `NEXT_PUBLIC_ENABLE_MOCK=false`로 운영 빌드
- [ ] EC2에서 `/health`, `/api/v1/recommendations/daily`, `/api/v1/savings/summary` smoke test

### P1

- [ ] Bedrock client 구현 및 `AI_PROVIDER=bedrock` 전환
- [ ] JSON Schema 검증 실패/timeout fallback 테스트
- [ ] EventBridge schedule로 매일 오전 6시 내부 Job API 호출
- [ ] CloudWatch Logs 수집 설정
- [ ] S3 bucket 생성: report PDF/presentation artifact 저장용
- [ ] Nginx reverse proxy 운영 도메인 정리

### P2

- [ ] Route 53 도메인 연결
- [ ] ALB 도입
- [ ] ECR에 image push
- [ ] ECS Fargate 전환
- [ ] CloudFront/Amplify Hosting으로 frontend 분리
- [ ] CloudWatch Alarms와 dashboard 구성
- [ ] S3 presigned URL 기반 월간 리포트 다운로드
- [ ] GitHub Actions 기반 CI/CD

## 16. Mermaid Architecture Diagram

```mermaid
flowchart LR
    User["User Browser"] --> FE["Next.js Frontend<br/>EC2 Docker or Amplify"]
    FE --> API["FastAPI Backend<br/>EC2 Docker"]

    API --> RDS[("RDS PostgreSQL<br/>profiles, plans, actions, summaries, AI logs")]
    API --> Bedrock["AWS Bedrock<br/>lifestyle analysis, recommendation copy"]
    API --> Weather["OpenWeatherMap<br/>forecast 5day/3h"]
    API --> S3[("S3<br/>monthly reports, PDFs, artifacts")]
    API --> CW["CloudWatch Logs<br/>API/AI/job logs"]

    EventBridge["EventBridge<br/>6 AM KST schedule"] --> InternalJob["Internal Job API<br/>generate daily recommendations"]
    InternalJob --> API
```

## 17. 현재 코드 기준으로 AWS 배포를 위해 추가로 필요한 파일 목록

현재 코드에서 AWS 배포를 위해 추가하면 좋은 파일은 다음이다.

| 파일 | 목적 | 우선순위 |
|---|---|---|
| `Dockerfile` | Next.js frontend production image | P0 |
| `backend/Dockerfile` | FastAPI backend production image | P0 |
| `docker-compose.prod.yml` | EC2에서 frontend/backend/nginx 실행 | P0 |
| `nginx/default.conf` | `/api` reverse proxy, frontend routing | P0 |
| `backend/.env.production.example` | 운영 backend 환경변수 템플릿 | P0 |
| `.env.production.example` | 운영 frontend 환경변수 템플릿 | P0 |
| `scripts/deploy-ec2.sh` | EC2 pull/build/restart 자동화 | P1 |
| `scripts/run-migrations.sh` | `alembic upgrade head` 실행 스크립트 | P0 |
| `docs/deploy-aws.md` | 실제 AWS 배포 절차 문서 | P0 |
| `infra/eventbridge-schedule.md` | 오전 6시 추천 생성 schedule 설정법 | P1 |

## 18. 추가로 수정하면 좋은 코드 항목

아직 실제 코드는 수정하지 않는다. 다만 AWS 배포 전 다음 항목을 추가하면 좋다.

- `backend/app/core/config.py`에 `OPENWEATHER_API_KEY`, `WEATHER_PROVIDER`, `AWS_REGION`, `BEDROCK_MODEL_ID`, `CORS_ALLOWED_ORIGINS`, 계산 상수 환경변수 반영
- `backend/app/services/ai_client.py`에 Bedrock provider 구현
- CloudWatch에서 보기 쉬운 JSON structured logging 추가
- S3 report storage adapter 추가
- EventBridge 내부 Job API invocation log 강화
- 프론트 운영 빌드에서 `NEXT_PUBLIC_ENABLE_MOCK=false` 누락 시 경고
- `scripts/capture-pdf.ts` 산출물인 `screenshots/`, `artifacts/` ignore 정책 정리

## 19. 참고 공식 문서

- AWS Bedrock: https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html
- Amazon RDS: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html
- Amazon S3: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
- EventBridge Scheduler: https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html
- CloudWatch Logs: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html
- Amazon ECS Fargate: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html
- AWS Amplify Hosting: https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html
