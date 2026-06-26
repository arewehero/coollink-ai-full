"""create users table

Revision ID: 0000_create_users
Revises:
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0000_create_users"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=True),
        sa.Column("profile_image", sa.Text(), nullable=True),
        sa.Column("provider", sa.String(length=30), server_default="google", nullable=False),
        sa.Column("provider_id", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_users_email", "users", ["email"], unique=True)
    op.create_index("uq_users_provider_provider_id", "users", ["provider", "provider_id"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_users_provider_provider_id", table_name="users")
    op.drop_index("uq_users_email", table_name="users")
    op.drop_table("users")
