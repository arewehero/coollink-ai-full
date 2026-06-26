from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import GoogleUserInfo, UserMeUpdateRequest


class UserRepository:
    def get_by_id(self, db: Session, user_id: uuid.UUID) -> Optional[User]:
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

    def update_required_profile_fields(self, db: Session, user: User, payload: UserMeUpdateRequest) -> User:
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        db.flush()
        return user
