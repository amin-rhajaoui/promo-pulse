import uuid
from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    selected_subgenres: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    total_keywords: Mapped[int] = mapped_column(Integer, default=0)
    completed_keywords: Mapped[int] = mapped_column(Integer, default=0)
    channels_found: Mapped[int] = mapped_column(Integer, default=0)
    emails_found: Mapped[int] = mapped_column(Integer, default=0)
    quota_used: Mapped[int] = mapped_column(Integer, default=0)
    current_keyword: Mapped[str | None] = mapped_column(String(255), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Channel(Base):
    __tablename__ = "channels"
    __table_args__ = (
        Index("idx_channels_score", "score", postgresql_using="btree"),
        Index("idx_channels_youtube_id", "youtube_id", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    youtube_id: Mapped[str] = mapped_column(String(24), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    custom_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    country: Mapped[str | None] = mapped_column(String(5), nullable=True)
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    subscriber_count: Mapped[int] = mapped_column(BigInteger, default=0)
    video_count: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(BigInteger, default=0)
    emails_pro: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    emails_personal: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    social_links: Mapped[dict] = mapped_column(JSONB, default=dict)
    has_submit_form: Mapped[bool] = mapped_column(Boolean, default=False)
    submit_urls: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    subgenres: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    score: Mapped[int] = mapped_column(Integer, default=0)
    tier: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_upload_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_buyable: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    scrape_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scrape_runs.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class QuotaLog(Base):
    __tablename__ = "quota_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    method: Mapped[str] = mapped_column(String(50), nullable=False)
    cost: Mapped[int] = mapped_column(Integer, nullable=False)
    quota_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
