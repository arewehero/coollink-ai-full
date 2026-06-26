from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import ApiException, api_meta_from_request
from app.dependencies import get_current_user_id, get_db, get_profile_repository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.common import ApiSuccessResponse
from app.schemas.profile import (
    EnergyProfileSchema,
    HomeEnvironmentSchema,
    LifestyleSchema,
    ProfilePayloadSchema,
)


router = APIRouter(prefix="/profile", tags=["Profile"])


def _load_profile_or_404(
    repo: ProfileRepository, db: Session, user_id: UUID
) -> dict:
    profile = repo.get_profile(db, user_id)
    if profile is None:
        raise ApiException(
            status_code=404,
            code="PROFILE_NOT_FOUND",
            message="사용자 프로필을 찾을 수 없습니다.",
        )
    return profile


@router.get("", response_model=ApiSuccessResponse[ProfilePayloadSchema])
def get_profile(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[ProfilePayloadSchema]:
    profile = _load_profile_or_404(repo, db, user_id)
    return ApiSuccessResponse(data=profile, meta=api_meta_from_request(request))


@router.put("", response_model=ApiSuccessResponse[ProfilePayloadSchema])
def save_profile(
    payload: ProfilePayloadSchema,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[ProfilePayloadSchema]:
    repo.save_profile(db, user_id, payload)
    db.commit()
    profile = _load_profile_or_404(repo, db, user_id)
    return ApiSuccessResponse(data=profile, meta=api_meta_from_request(request))


@router.patch("/home-environment", response_model=ApiSuccessResponse[ProfilePayloadSchema])
def update_home_environment(
    body: HomeEnvironmentSchema,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[ProfilePayloadSchema]:
    repo.update_home_environment(db, user_id, body)
    db.commit()
    profile = _load_profile_or_404(repo, db, user_id)
    return ApiSuccessResponse(data=profile, meta=api_meta_from_request(request))


@router.patch("/lifestyle", response_model=ApiSuccessResponse[ProfilePayloadSchema])
def update_lifestyle(
    body: LifestyleSchema,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[ProfilePayloadSchema]:
    repo.update_lifestyle(db, user_id, body)
    db.commit()
    profile = _load_profile_or_404(repo, db, user_id)
    return ApiSuccessResponse(data=profile, meta=api_meta_from_request(request))


@router.patch("/energy", response_model=ApiSuccessResponse[ProfilePayloadSchema])
def update_energy(
    body: EnergyProfileSchema,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[ProfilePayloadSchema]:
    repo.update_energy(db, user_id, body)
    db.commit()
    profile = _load_profile_or_404(repo, db, user_id)
    return ApiSuccessResponse(data=profile, meta=api_meta_from_request(request))
