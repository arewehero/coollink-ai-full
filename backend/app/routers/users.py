"""Users router — anonymous user creation endpoint.

POST /api/v1/users/anonymous does not require X-User-Id header.
Requirements: 1.1, 1.2, 1.5
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.errors import ApiException, api_meta_from_request
from app.db.session import get_db
from app.dependencies import get_current_user_id
from app.repositories.user_repository import UserRepository
from app.schemas.common import ApiSuccessResponse
from app.schemas.user import AnonymousUserResponse

router = APIRouter(prefix="/users", tags=["users"])


def get_user_repository() -> UserRepository:
    return UserRepository()


@router.post(
    "/anonymous",
    response_model=ApiSuccessResponse[AnonymousUserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="익명 사용자 생성",
    description="별도의 인증 없이 UUID v4 기반 익명 사용자를 생성합니다.",
)
def create_anonymous_user(
    request: Request,
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApiSuccessResponse[AnonymousUserResponse]:
    """Create anonymous user without requiring X-User-Id header.

    Returns 201 Created with user_id, user_type, and created_at.
    """
    user = user_repo.create_anonymous_user(db)
    response_data = AnonymousUserResponse(
        user_id=user.id,
        user_type=user.user_type,
        created_at=user.created_at,
    )
    return ApiSuccessResponse(
        data=response_data,
        meta=api_meta_from_request(request),
    )


@router.get(
    "/me",
    response_model=ApiSuccessResponse[AnonymousUserResponse],
    summary="내 사용자 조회",
    description="X-User-Id 헤더로 전달된 사용자의 정보를 조회합니다.",
)
def get_me(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApiSuccessResponse[AnonymousUserResponse]:
    """Return the current user identified by the X-User-Id header."""
    user = user_repo.get_user_by_id(db, user_id)
    if user is None:
        raise ApiException(
            status_code=404,
            code="USER_NOT_FOUND",
            message="사용자를 찾을 수 없습니다.",
        )
    return ApiSuccessResponse(
        data=AnonymousUserResponse(
            user_id=user.id,
            user_type=user.user_type,
            created_at=user.created_at,
        ),
        meta=api_meta_from_request(request),
    )
