import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import ApiException, api_exception_handler
from app.routers.ai import router as ai_router
from app.routers.analysis import router as analysis_router
from app.routers.auth import router as auth_router
from app.routers.calculations import router as calculations_router
from app.routers.internal import router as internal_router
from app.routers.meta import router as meta_router
from app.routers.profile import router as profile_router
from app.routers.recommendations import router as recommendations_router
from app.routers.savings import router as savings_router
from app.routers.users import router as users_router
from app.routers.weather import router as weather_router


app = FastAPI(title=settings.app_name)

# CORS (프론트엔드 연동) — CORS_ALLOWED_ORIGINS 설정 반영
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_allowed_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    # Req 12.4: 요청별 고유 UUID v4 형식의 request_id
    request.state.request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-Id"] = request.state.request_id
    return response


app.add_exception_handler(ApiException, api_exception_handler)
app.include_router(ai_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(calculations_router, prefix="/api/v1")
app.include_router(internal_router, prefix="/api/v1")
app.include_router(meta_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1")
app.include_router(savings_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(weather_router, prefix="/api/v1")
