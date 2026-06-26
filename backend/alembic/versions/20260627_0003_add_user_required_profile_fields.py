"""add user required profile fields

Revision ID: 0003_user_required_profile
Revises: 0002_profile_domain
Create Date: 2026-06-27 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_user_required_profile"
down_revision: Union[str, None] = "0002_profile_domain"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("region", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("household_size", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("residence_type", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("main_cooling_device", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "main_cooling_device")
    op.drop_column("users", "residence_type")
    op.drop_column("users", "household_size")
    op.drop_column("users", "region")
