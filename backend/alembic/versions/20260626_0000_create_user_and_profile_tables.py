"""create user and profile domain tables

Revision ID: 0000_user_profile_domain
Revises:
Create Date: 2026-06-26 00:00:00.000000

users 도메인(users, home_environments, lifestyle_inputs, user_profiles)을 생성한다.
0001(recommendation)·0002(score/weather)가 users.id를 FK로 참조하므로
반드시 그보다 먼저 적용돼야 한다(현재 체인의 최상단).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0000_user_profile_domain"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_type", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "home_environments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("housing_type", sa.String(length=20), nullable=False),
        sa.Column("direction", sa.String(length=10), nullable=False),
        sa.Column("floor_level", sa.String(length=10), nullable=False),
        sa.Column("building_age", sa.String(length=10), nullable=False),
        sa.Column("insulation_level", sa.String(length=10), nullable=False),
        sa.Column("window_size", sa.String(length=10), nullable=False),
        sa.Column("ventilation_level", sa.String(length=10), nullable=False),
        sa.Column("window_sealing", sa.String(length=10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_home_environments_user_id", "home_environments", ["user_id"], unique=True)

    op.create_table(
        "lifestyle_inputs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("main_activity_time", sa.String(length=20), nullable=False),
        sa.Column("daytime_home_stay", sa.String(length=20), nullable=False),
        sa.Column("sleep_time", sa.String(length=10), nullable=False),
        sa.Column("outdoor_activity", sa.String(length=10), nullable=False),
        sa.Column("hot_time_home_stay", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_lifestyle_inputs_user_id", "lifestyle_inputs", ["user_id"], unique=True)

    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("monthly_electricity_bill", sa.Integer(), nullable=False),
        sa.Column("monthly_goal_bill", sa.Integer(), nullable=True),
        sa.Column("comfort_preference", sa.String(length=20), nullable=False),
        sa.Column("ac_type", sa.String(length=10), nullable=False),
        sa.Column("has_fan", sa.Boolean(), nullable=False),
        sa.Column("curtain_type", sa.String(length=10), nullable=False),
        sa.Column("ac_power_watt", sa.Integer(), nullable=True),
        sa.Column("room_size", sa.String(length=10), nullable=True),
        sa.Column("current_temperature_setting", sa.Numeric(5, 2), nullable=True),
        sa.Column("daily_ac_usage_hours", sa.Numeric(5, 2), nullable=True),
        sa.Column("electricity_unit_price", sa.Numeric(7, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_user_profiles_user_id", "user_profiles", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_user_profiles_user_id", table_name="user_profiles")
    op.drop_table("user_profiles")
    op.drop_index("uq_lifestyle_inputs_user_id", table_name="lifestyle_inputs")
    op.drop_table("lifestyle_inputs")
    op.drop_index("uq_home_environments_user_id", table_name="home_environments")
    op.drop_table("home_environments")
    op.drop_table("users")
