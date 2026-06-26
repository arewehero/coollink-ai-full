from __future__ import annotations

import datetime as dt
import uuid
from typing import Optional

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        # 소셜 로그인 식별용 (익명 사용자는 email/provider가 null이며, NULL은 unique 제약에서 중복 허용)
        Index("uq_users_email", "email", unique=True),
        Index("uq_users_provider_provider_id", "provider", "provider_id", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # 익명 사용자(X-User-Id)용 구분값. 소셜 로그인 사용자는 null일 수 있음.
    user_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # --- 소셜 로그인(Google) 사용자 필드 — 익명 사용자는 전부 null ---
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    household_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    residence_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    main_cooling_device: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    provider_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[dt.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
