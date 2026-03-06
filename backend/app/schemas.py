from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


# --- Channels ---

class ChannelOut(BaseModel):
    id: UUID
    youtube_id: str
    title: str
    custom_url: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    country: str | None = None
    published_at: date | None = None
    subscriber_count: int = 0
    video_count: int = 0
    view_count: int = 0
    emails_pro: list[str] = []
    emails_personal: list[str] = []
    social_links: dict = {}
    has_submit_form: bool = False
    submit_urls: list[str] = []
    subgenres: list[str] = []
    score: int = 0
    tier: str | None = None
    notes: str | None = None
    last_upload_at: date | None = None
    is_buyable: bool = False
    authenticity_score: int = 0
    authenticity_label: str = "unknown"
    authenticity_signals: dict = {}
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChannelUpdateRequest(BaseModel):
    notes: str | None = None


class ChannelListOut(BaseModel):
    items: list[ChannelOut]
    total: int
    page: int
    page_size: int


# --- Scraping ---

class ScrapeStartRequest(BaseModel):
    subgenres: list[str]
    demo_mode: bool = False


class ScrapeRunOut(BaseModel):
    id: UUID
    status: str
    selected_subgenres: list[str]
    total_keywords: int = 0
    completed_keywords: int = 0
    channels_found: int = 0
    emails_found: int = 0
    quota_used: int = 0
    current_keyword: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubgenreOut(BaseModel):
    id: str
    name: str
    keyword_count: int


class QuotaOut(BaseModel):
    used: int
    limit: int
    remaining: int


# --- Stats ---

class StatsOut(BaseModel):
    total_channels: int
    channels_with_email: int
    avg_score: float
    total_runs: int
    total_emails: int
    tier_distribution: dict[str, int]
    subgenre_distribution: dict[str, int]
    score_distribution: dict[str, int]
