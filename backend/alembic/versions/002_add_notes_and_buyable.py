"""add notes, last_upload_at, is_buyable columns

Revision ID: 002
Revises: 001
Create Date: 2024-01-02
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("channels", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("channels", sa.Column("last_upload_at", sa.Date(), nullable=True))
    op.add_column("channels", sa.Column("is_buyable", sa.Boolean(), server_default="false", nullable=False))


def downgrade():
    op.drop_column("channels", "is_buyable")
    op.drop_column("channels", "last_upload_at")
    op.drop_column("channels", "notes")
