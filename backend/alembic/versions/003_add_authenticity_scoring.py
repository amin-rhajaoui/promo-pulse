"""add authenticity scoring columns

Revision ID: 003
Revises: 002
Create Date: 2026-03-06
"""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    # Authenticity score (0-100) — higher = more likely real
    op.add_column("channels", sa.Column("authenticity_score", sa.Integer(), server_default="0", nullable=False))
    # Authenticity label: clean / suspect / fake
    op.add_column("channels", sa.Column("authenticity_label", sa.String(10), server_default="unknown", nullable=False))
    # Individual signals (stored for transparency/debugging)
    op.add_column("channels", sa.Column("authenticity_signals", sa.JSON(), server_default="{}", nullable=False))

    op.create_index("idx_channels_authenticity", "channels", ["authenticity_score"], postgresql_using="btree")


def downgrade():
    op.drop_index("idx_channels_authenticity")
    op.drop_column("channels", "authenticity_signals")
    op.drop_column("channels", "authenticity_label")
    op.drop_column("channels", "authenticity_score")
