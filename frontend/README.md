# CoolLink AI FE

탄소중립 및 전기요금 절약 행동 추천 프론트엔드.
AI 생활패턴 판단, 시간대별 날씨, 집 환경 정보를 바탕으로 일상 절약 행동을 추천한다.

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (semantic 디자인 토큰)
- 모바일 우선 (max-width 480px 중앙 정렬)

## 시작하기

```bash
npm install
cp .env.example .env.local   # 환경변수 설정
npm run dev                  # http://localhost:3000
```

로컬 주소: http://localhost:3000

## 현재 상태

MVP 사용자 흐름(**부트스트랩 → 온보딩 → 위치 → 오늘 → 리포트 / 시뮬레이터 / 설정**)이 동작한다.

### 구현됨

- **부트스트랩** — 익명 사용자 생성/조회 후 분기 (§6, §10.1)
- **온보딩 3단계** — RHF + Zod, draft 저장, 프로필 저장 (§10.2~§10.5)
- **위치 설정** — GPS/지역 선택 → 플랜 생성 (§10.6)
- **오늘** — 날씨·AI 유형·절약 요약·진행률·행동 카드 + 완료 토글(optimistic) (§10.7~§10.12)
- **리포트** — 기간 탭 + 절약액/kWh/CO₂/목표 카드 (§10.13)
- **시뮬레이터** — 온도/시간 → `/calculations/estimate` (§10.14)
- **설정** — 프로필 수정(섹션별 PATCH + 재생성) · 위치 · 계산 기준 · 데이터 초기화 (§10.15)
- 공통: `AppShell` + `BottomNav`, `ToastProvider`, `ConfirmModal`, `ErrorView`, `SkeletonCard`, 디자인 토큰
- 오류 처리: 날씨 실패 · AI fallback · 프로필 없음 · 추천 없음 · 네트워크 오류 (§14)
- 모바일 우선(360px~) 무가로스크롤 확인

### API 모드

기본은 FastAPI 백엔드 연동이며, `NEXT_PUBLIC_ENABLE_MOCK=true`면 백엔드 없이 [mock 데이터](src/lib/mock/api.ts)로 전 화면이 동작한다 (§24).

### 후속 (미구현)

- React Query 마이그레이션(캐싱/invalidate, §7.4·§13)
- 월간 캘린더(§10.13), 행동 상세 모달(§10.11)
- 테스트 코드(§23)

### 제외 (명세서 §3.2)

관리자 대시보드 · 취약계층 · 건강 정보 · SMS/카카오 알림 관련 화면/라우트/문구는 만들지 않는다.

## 라우트

| Route | 화면 |
|---|---|
| `/` | 부트스트랩 (분기) |
| `/onboarding` | 온보딩 3단계 |
| `/location` | 위치 설정 |
| `/today` | 오늘의 절약 플랜 |
| `/today/actions/[actionId]` | 행동 상세 |
| `/simulator` | 요금 시뮬레이션 |
| `/report` | 절약 리포트 |
| `/settings` | 설정 홈 |
| `/settings/profile` | 프로필 수정 |
| `/settings/assumptions` | 계산 기준 안내 |

## 폴더 구조 (명세서 §21)

```text
src/
  app/          # App Router 라우트 + layout/error/loading
  components/   # common / onboarding / today / report / simulator / settings / form
  features/     # 화면별 도메인 로직 (bootstrap / onboarding / location / today / report / simulator / settings)
  lib/          # api(client/endpoints/errors/mock) / storage / format
  schemas/      # Zod 스키마
  types/        # API·도메인 타입
  tests/        # unit / components / e2e (미작성)
```

> `hooks/` · `lib/constants/` · `tests/`는 아직 구조만 잡힌 상태(`.gitkeep`). 화면별 데이터 훅은 각 `features/*`에 위치한다.
