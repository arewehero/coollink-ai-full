from __future__ import annotations

import logging
import traceback
from typing import Any, Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import api_meta_from_request
from app.db.session import get_db
from app.dependencies import (
    get_current_user_for_auth,
    get_google_oauth_client,
    get_profile_repository,
    get_user_repository,
)
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserMeResponse, UserMeUpdateRequest
from app.schemas.common import ApiSuccessResponse
from app.services.google_oauth import GoogleOAuthClient, GoogleOAuthError
from app.services.jwt_service import create_access_token


logger = logging.getLogger("app.auth")

router = APIRouter(tags=["auth"])


def _profile_value(profile: Optional[dict[str, Any]], section: str, key: str) -> Optional[Any]:
    if not profile:
        return None
    value = profile.get(section)
    if not isinstance(value, dict):
        return None
    return value.get(key)


def _load_profile_or_none(
    profile_repository: ProfileRepository,
    db: Session,
    user_id,
) -> Optional[dict[str, Any]]:
    try:
        return profile_repository.get_profile(db, user_id)
    except AttributeError:
        # 일부 단위 테스트의 fake db는 SQLAlchemy bind를 제공하지 않는다.
        return None


def _build_user_me_response(user, profile: Optional[dict[str, Any]]) -> UserMeResponse:
    has_profile = profile is not None
    residence_type = getattr(user, "residence_type", None) or _profile_value(
        profile,
        "home_environment",
        "housing_type",
    )
    main_cooling_device = getattr(user, "main_cooling_device", None) or _profile_value(
        profile,
        "energy_profile",
        "ac_type",
    )
    return UserMeResponse(
        id=user.id,
        user_id=user.id,
        name=user.name,
        email=user.email,
        profile_image=user.profile_image,
        region=getattr(user, "region", None),
        household_size=getattr(user, "household_size", None),
        residence_type=residence_type,
        main_cooling_device=main_cooling_device,
        has_profile=has_profile,
        profile_completed=has_profile,
    )


def _frontend_callback_url(
    *,
    token: Optional[str] = None,
    error: Optional[str] = None,
    detail: Optional[str] = None,
) -> str:
    if token:
        params = {"token": token}
    else:
        params = {"error": error or "google_auth_failed"}
        # 로컬 개발 환경에서만 실제 원인(error_detail)을 함께 전달한다 (요구사항 7).
        if detail and settings.app_env == "local":
            params["detail"] = detail
    return f"{settings.frontend_url.rstrip('/')}/auth/callback?{urlencode(params)}"


@router.get("/auth/google/login", summary="Redirect to Google OAuth login")
async def google_login(oauth_client: GoogleOAuthClient = Depends(get_google_oauth_client)) -> RedirectResponse:
    try:
        return RedirectResponse(oauth_client.build_login_url())
    except GoogleOAuthError:
        return RedirectResponse(_frontend_callback_url(error="google_auth_failed"))


@router.get("/auth/google/callback", summary="Handle Google OAuth callback")
async def google_callback(
    code: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    oauth_client: GoogleOAuthClient = Depends(get_google_oauth_client),
    user_repository: UserRepository = Depends(get_user_repository),
) -> RedirectResponse:
    # Google이 직접 error를 돌려준 경우(사용자 취소·동의 거부 등)
    if error:
        logger.warning("Google OAuth returned error param: %s", error)
        return RedirectResponse(
            _frontend_callback_url(error="google_auth_failed", detail=f"google_error: {error}")
        )
    if not code:
        logger.warning("Google OAuth callback called without authorization code")
        return RedirectResponse(
            _frontend_callback_url(error="google_auth_failed", detail="missing_authorization_code")
        )

    try:
        google_user = await oauth_client.fetch_user_info(code)
        user = user_repository.get_or_create_google_user(db, google_user)
        access_token = create_access_token(user.id)
        db.commit()
        db.refresh(user)
        return RedirectResponse(_frontend_callback_url(token=access_token))
    except Exception as exc:  # noqa: BLE001 - 원인을 반드시 로깅한 뒤 프론트로 안전하게 리다이렉트
        db.rollback()
        # 요구사항 1: 실제 예외 내용(스택트레이스)을 로그로 출력한다.
        logger.exception("Google OAuth callback failed")
        traceback.print_exc()
        detail = f"{type(exc).__name__}: {exc}"
        return RedirectResponse(
            _frontend_callback_url(error="google_auth_failed", detail=detail)
        )


@router.get("/user/me", response_model=ApiSuccessResponse[UserMeResponse], summary="Get current authenticated user")
def get_me(
    request: Request,
    current_user=Depends(get_current_user_for_auth),
    db: Session = Depends(get_db),
    profile_repository: ProfileRepository = Depends(get_profile_repository),
):
    profile = _load_profile_or_none(profile_repository, db, current_user.id)
    return ApiSuccessResponse(
        data=_build_user_me_response(current_user, profile),
        meta=api_meta_from_request(request),
    )


@router.patch("/user/me", response_model=ApiSuccessResponse[UserMeResponse], summary="Update current user profile fields")
def update_me(
    request_body: UserMeUpdateRequest,
    request: Request,
    current_user=Depends(get_current_user_for_auth),
    db: Session = Depends(get_db),
    user_repository: UserRepository = Depends(get_user_repository),
    profile_repository: ProfileRepository = Depends(get_profile_repository),
):
    updated_user = user_repository.update_required_profile_fields(db, current_user, request_body)
    db.commit()
    db.refresh(updated_user)
    profile = _load_profile_or_none(profile_repository, db, updated_user.id)
    return ApiSuccessResponse(
        data=_build_user_me_response(updated_user, profile),
        meta=api_meta_from_request(request),
    )
