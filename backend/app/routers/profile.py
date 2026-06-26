"""Profile router: PUT /api/v1/profile for full profile upsert.

Requirements: 2.1, 2.5, 2.6, 2.7
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import ApiException, ErrorCode, api_meta_from_request
from app.core.security import get_current_user_id
from app.db.session import get_db
from app.repositories.profile_repository import ProfileRepository
from app.schemas.common import ApiSuccessResponse
from app.schemas.profile import (
    EnergyProfileSchema,
    FullProfileRequest,
    FullProfileResponse,
    HomeEnvironmentSchema,
    LifestyleSchema,
)


router = APIRouter(prefix="/profile", tags=["Profile"])


def get_profile_repository() -> ProfileRepository:
    return ProfileRepository()


@router.put("", response_model=ApiSuccessResponse[FullProfileResponse])
def upsert_profile(
    request: Request,
    body: FullProfileRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[FullProfileResponse]:
    """Save or update the full profile (home_environment + lifestyle + energy_profile).

    Upserts all three profile tables for the authenticated user.
    Returns 200 OK with the stored profile data.
    """
    home = repo.upsert_home_environment(db, user_id, body.home_environment)
    lifestyle = repo.upsert_lifestyle_input(db, user_id, body.lifestyle)
    energy = repo.upsert_energy_profile(db, user_id, body.energy_profile)
    db.commit()
    db.refresh(home)
    db.refresh(lifestyle)
    db.refresh(energy)

    response_data = FullProfileResponse(
        home_environment=HomeEnvironmentSchema.model_validate(home),
        lifestyle=LifestyleSchema.model_validate(lifestyle),
        energy_profile=EnergyProfileSchema.model_validate(energy),
    )

    return ApiSuccessResponse(
        data=response_data,
        meta=api_meta_from_request(request),
    )


def _build_full_profile_response(
    request: Request,
    db: Session,
    user_id: UUID,
    repo: ProfileRepository,
) -> ApiSuccessResponse[FullProfileResponse]:
    """현재 사용자의 전체 프로필을 조회해 응답으로 만든다. 미등록 시 PROFILE_REQUIRED."""
    result = repo.get_full_profile(db, user_id)
    if result is None:
        raise ApiException.from_error_code(ErrorCode.PROFILE_REQUIRED)
    home, lifestyle, energy = result
    response_data = FullProfileResponse(
        home_environment=HomeEnvironmentSchema.model_validate(home),
        lifestyle=LifestyleSchema.model_validate(lifestyle),
        energy_profile=EnergyProfileSchema.model_validate(energy),
    )
    return ApiSuccessResponse(
        data=response_data,
        meta=api_meta_from_request(request),
    )


@router.get("", response_model=ApiSuccessResponse[FullProfileResponse])
def read_profile(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[FullProfileResponse]:
    """전체 프로필 조회 (설정/프로필 화면용). 미등록 시 422 PROFILE_REQUIRED."""
    return _build_full_profile_response(request, db, user_id, repo)


@router.patch("/home-environment", response_model=ApiSuccessResponse[FullProfileResponse])
def patch_home_environment(
    request: Request,
    body: HomeEnvironmentSchema,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[FullProfileResponse]:
    """집 환경만 수정한다. 수정 후 전체 프로필을 반환한다."""
    repo.upsert_home_environment(db, user_id, body)
    db.commit()
    return _build_full_profile_response(request, db, user_id, repo)


@router.patch("/lifestyle", response_model=ApiSuccessResponse[FullProfileResponse])
def patch_lifestyle(
    request: Request,
    body: LifestyleSchema,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[FullProfileResponse]:
    """생활패턴만 수정한다. 수정 후 전체 프로필을 반환한다."""
    repo.upsert_lifestyle_input(db, user_id, body)
    db.commit()
    return _build_full_profile_response(request, db, user_id, repo)


@router.patch("/energy", response_model=ApiSuccessResponse[FullProfileResponse])
def patch_energy(
    request: Request,
    body: EnergyProfileSchema,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ApiSuccessResponse[FullProfileResponse]:
    """냉난방·요금만 수정한다. 수정 후 전체 프로필을 반환한다."""
    repo.upsert_energy_profile(db, user_id, body)
    db.commit()
    return _build_full_profile_response(request, db, user_id, repo)
