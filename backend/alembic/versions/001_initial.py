"""initial

Revision ID: 001
Revises:
Create Date: 2024-01-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "scrape_runs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("selected_subgenres", ARRAY(sa.String), nullable=False),
        sa.Column("total_keywords", sa.Integer, server_default="0"),
        sa.Column("completed_keywords", sa.Integer, server_default="0"),
        sa.Column("channels_found", sa.Integer, server_default="0"),
        sa.Column("emails_found", sa.Integer, server_default="0"),
        sa.Column("quota_used", sa.Integer, server_default="0"),
        sa.Column("current_keyword", sa.String(255), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "channels",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("youtube_id", sa.String(24), unique=True, nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("custom_url", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("thumbnail_url", sa.Text, nullable=True),
        sa.Column("country", sa.String(5), nullable=True),
        sa.Column("published_at", sa.Date, nullable=True),
        sa.Column("subscriber_count", sa.BigInteger, server_default="0"),
        sa.Column("video_count", sa.Integer, server_default="0"),
        sa.Column("view_count", sa.BigInteger, server_default="0"),
        sa.Column("emails_pro", ARRAY(sa.String), server_default="{}"),
        sa.Column("emails_personal", ARRAY(sa.String), server_default="{}"),
        sa.Column("social_links", JSONB, server_default="{}"),
        sa.Column("has_submit_form", sa.Boolean, server_default="false"),
        sa.Column("submit_urls", ARRAY(sa.String), server_default="{}"),
        sa.Column("subgenres", ARRAY(sa.String), server_default="{}"),
        sa.Column("score", sa.Integer, server_default="0"),
        sa.Column("tier", sa.String(10), nullable=True),
        sa.Column("scrape_run_id", UUID(as_uuid=True), sa.ForeignKey("scrape_runs.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_channels_score", "channels", ["score"], postgresql_using="btree")
    op.create_index("idx_channels_youtube_id", "channels", ["youtube_id"], unique=True)

    op.create_table(
        "quota_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("method", sa.String(50), nullable=False),
        sa.Column("cost", sa.Integer, nullable=False),
        sa.Column("quota_date", sa.Date, server_default=sa.text("CURRENT_DATE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("quota_logs")
    op.drop_table("channels")
    op.drop_table("scrape_runs")
