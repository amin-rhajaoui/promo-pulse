"""add is_dj column

Revision ID: 005
Revises: 004
Create Date: 2026-03-06
"""

from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("channels", sa.Column("is_dj", sa.Boolean(), server_default="false", nullable=False))


def downgrade():
    op.drop_column("channels", "is_dj")
