"""create profile domain tables

Revision ID: 0002_profile_domain
Revises: 0001_recommendation_domain
Create Date: 2026-06-27 00:00:00.000000

프로필 도메인(원래 "다른 백엔드 파트" 소유)을 이 백엔드에 구축한다.
ProfileRepository.get_profile이 읽는 3개 테이블을 생성한다.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_profile_domain"
down_revision: Union[str, None] = "0001_recommendation_domain"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _user_fk_column() -> sa.Column:
    return sa.Column(
        "user_id",
        postgresql.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "home_environments",
        _user_fk_column(),
        sa.Column("housing_type", sa.String(length=30), nullable=False),
        sa.Column("direction", sa.String(length=30), nullable=False),
        sa.Column("floor_level", sa.String(length=30), nullable=False),
        sa.Column("building_age", sa.String(length=30), nullable=False),
        sa.Column("insulation_level", sa.String(length=30), nullable=False),
        sa.Column("window_size", sa.String(length=30), nullable=False),
        sa.Column("ventilation_level", sa.String(length=30), nullable=False),
        sa.Column("window_sealing", sa.String(length=30), nullable=False),
        *_timestamps(),
    )

    op.create_table(
        "lifestyle_inputs",
        _user_fk_column(),
        sa.Column("main_activity_time", sa.String(length=30), nullable=False),
        sa.Column("daytime_home_stay", sa.String(length=30), nullable=False),
        sa.Column("sleep_time", sa.String(length=30), nullable=False),
        sa.Column("outdoor_activity", sa.String(length=30), nullable=False),
        sa.Column("hot_time_home_stay", sa.String(length=30), nullable=False),
        *_timestamps(),
    )

    op.create_table(
        "user_profiles",
        _user_fk_column(),
        sa.Column("monthly_electricity_bill", sa.Float(), nullable=False),
        sa.Column("monthly_goal_bill", sa.Float(), nullable=True),
        sa.Column("comfort_preference", sa.String(length=30), nullable=False),
        sa.Column("ac_type", sa.String(length=30), nullable=False),
        sa.Column("has_fan", sa.Boolean(), nullable=False),
        sa.Column("curtain_type", sa.String(length=30), nullable=False),
        sa.Column("ac_power_watt", sa.Float(), nullable=True),
        sa.Column("room_size", sa.String(length=30), nullable=True),
        sa.Column("current_temperature_setting", sa.Float(), nullable=True),
        sa.Column("daily_ac_usage_hours", sa.Float(), nullable=True),
        sa.Column("electricity_unit_price", sa.Float(), nullable=True),
        *_timestamps(),
    )


def downgrade() -> None:
    op.drop_table("user_profiles")
    op.drop_table("lifestyle_inputs")
    op.drop_table("home_environments")
