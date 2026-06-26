from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import GoogleUserInfo, UserMeUpdateRequest


class UserRepository:
    """Repository for User entity persistence."""

    def create_anonymous_user(self, db: Session) -> User:
        """Create a new anonymous user with a UUID v4 id.

        Returns the created User instance.
        """
        user = User(
            id=uuid.uuid4(),
            user_type="anonymous",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_user_by_id(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
        """Retrieve a user by id, excluding soft-deleted users.

        Returns None if user does not exist or is soft-deleted.
        """
        return (
            db.query(User)
            .filter(User.id == user_id, User.deleted_at.is_(None))
            .first()
        )

    # ------------------------------------------------------------------
    # 소셜 로그인(Google) — codex 통합
    # ------------------------------------------------------------------

    def get_by_id(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
        """soft-delete 무관하게 id로 조회(JWT 인증 경로용)."""
        return db.get(User, user_id)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email.lower())
        return db.execute(statement).scalars().first()

    def get_or_create_google_user(self, db: Session, google_user: GoogleUserInfo) -> User:
        email = google_user.email.lower()
        user = self.get_by_email(db, email)
        if user is None:
            user = User(
                email=email,
                name=google_user.name,
                profile_image=google_user.picture,
                provider="google",
                provider_id=google_user.sub,
            )
            db.add(user)
            db.flush()
            return user

        user.name = user.name or google_user.name
        user.profile_image = user.profile_image or google_user.picture
        user.provider = user.provider or "google"
        user.provider_id = user.provider_id or google_user.sub
        db.flush()
        return user

    def update_required_profile_fields(
        self, db: Session, user: User, payload: UserMeUpdateRequest
    ) -> User:
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        db.flush()
        return user
