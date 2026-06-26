"""add google auth columns to users table

Revision ID: 0003_google_auth_columns
Revises: 0002_score_weather
Create Date: 2026-06-27 00:00:00.000000

users 테이블에 소셜 로그인(Google OAuth) 관련 컬럼을 추가한다.
- email, name, profile_image, region, household_size,
  residence_type, main_cooling_device, provider, provider_id, is_active
- user_type을 nullable로 변경 (소셜 로그인 사용자는 null 가능)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_google_auth_columns"
down_revision: Union[str, None] = "0002_score_weather"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # user_type을 nullable로 변경
    op.alter_column("users", "user_type", existing_type=sa.String(length=20), nullable=True)

    # 소셜 로그인 컬럼 추가
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("profile_image", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("region", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("household_size", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("residence_type", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("main_cooling_device", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("provider", sa.String(length=30), nullable=True))
    op.add_column("users", sa.Column("provider_id", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))

    # 유니크 인덱스 생성
    op.create_index("uq_users_email", "users", ["email"], unique=True)
    op.create_index("uq_users_provider_provider_id", "users", ["provider", "provider_id"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_users_provider_provider_id", table_name="users")
    op.drop_index("uq_users_email", table_name="users")

    op.drop_column("users", "is_active")
    op.drop_column("users", "provider_id")
    op.drop_column("users", "provider")
    op.drop_column("users", "main_cooling_device")
    op.drop_column("users", "residence_type")
    op.drop_column("users", "household_size")
    op.drop_column("users", "region")
    op.drop_column("users", "profile_image")
    op.drop_column("users", "name")
    op.drop_column("users", "email")

    op.alter_column("users", "user_type", existing_type=sa.String(length=20), nullable=False)
