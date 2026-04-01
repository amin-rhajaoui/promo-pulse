import httpx
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import QuotaLog

BASE_URL = "https://www.googleapis.com/youtube/v3"


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None

# API quota costs
QUOTA_COSTS = {
    "search.list": 100,
    "channels.list": 1,
    "playlistItems.list": 1,
}


class YouTubeAPI:
    def __init__(self, db: AsyncSession):
        self.api_key = settings.youtube_api_key
        self.db = db
        self._client = httpx.AsyncClient(timeout=30)

    async def close(self):
        await self._client.aclose()

    async def get_quota_used_today(self) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.sum(QuotaLog.cost), 0)).where(
                QuotaLog.quota_date == date.today()
            )
        )
        return result.scalar_one()

    async def _log_quota(self, method: str, cost: int):
        log = QuotaLog(method=method, cost=cost)
        self.db.add(log)
        await self.db.flush()

    async def _check_quota(self, method: str) -> bool:
        cost = QUOTA_COSTS.get(method, 1)
        used = await self.get_quota_used_today()
        return (used + cost) <= settings.daily_quota_limit

    async def search_channels(self, query: str, max_pages: int = 5) -> list[dict]:
        """Search for YouTube channels by keyword, paginating through results."""
        all_results: list[dict] = []
        page_token: str | None = None

        for _ in range(max_pages):
            if not await self._check_quota("search.list"):
                break

            params: dict = {
                "part": "snippet",
                "q": query,
                "type": "channel",
                "maxResults": 50,
                "key": self.api_key,
            }
            if page_token:
                params["pageToken"] = page_token

            resp = await self._client.get(f"{BASE_URL}/search", params=params)
            await self._log_quota("search.list", QUOTA_COSTS["search.list"])

            if resp.status_code != 200:
                break

            data = resp.json()
            for item in data.get("items", []):
                if item.get("id", {}).get("kind") == "youtube#channel":
                    all_results.append({
                        "youtube_id": item["snippet"]["channelId"],
                        "title": item["snippet"]["title"],
                        "description": item["snippet"]["description"],
                        "thumbnail_url": item["snippet"]["thumbnails"].get("default", {}).get("url"),
                    })

            page_token = data.get("nextPageToken")
            if not page_token:
                break

        return all_results

    async def get_channel_details(self, channel_ids: list[str]) -> list[dict]:
        """Get detailed info for up to 50 channels at once."""
        if not channel_ids:
            return []
        if not await self._check_quota("channels.list"):
            return []

        params = {
            "part": "snippet,statistics,brandingSettings",
            "id": ",".join(channel_ids[:50]),
            "key": self.api_key,
        }
        resp = await self._client.get(f"{BASE_URL}/channels", params=params)
        await self._log_quota("channels.list", QUOTA_COSTS["channels.list"])

        if resp.status_code != 200:
            return []

        results = []
        for item in resp.json().get("items", []):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            branding = item.get("brandingSettings", {}).get("channel", {})

            snippet_desc = snippet.get("description", "")
            branding_desc = branding.get("description", "")
            # Only append branding description if it adds new info
            if branding_desc and branding_desc != snippet_desc:
                full_desc = snippet_desc + "\n" + branding_desc
            else:
                full_desc = snippet_desc

            results.append({
                "youtube_id": item["id"],
                "title": snippet.get("title", ""),
                "custom_url": snippet.get("customUrl"),
                "description": full_desc,
                "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url"),
                "country": snippet.get("country"),
                "published_at": _parse_date(snippet.get("publishedAt")),
                "subscriber_count": int(stats.get("subscriberCount", 0)),
                "video_count": int(stats.get("videoCount", 0)),
                "view_count": int(stats.get("viewCount", 0)),
            })

        return results

    async def get_last_upload_date(self, channel_id: str) -> date | None:
        """Get date of most recent upload for a channel using its uploads playlist."""
        if not await self._check_quota("playlistItems.list"):
            return None

        # Uploads playlist ID = "UU" + channel_id[2:]
        uploads_playlist_id = "UU" + channel_id[2:]
        params = {
            "part": "snippet",
            "playlistId": uploads_playlist_id,
            "maxResults": 1,
            "key": self.api_key,
        }
        resp = await self._client.get(f"{BASE_URL}/playlistItems", params=params)
        await self._log_quota("playlistItems.list", QUOTA_COSTS["playlistItems.list"])

        if resp.status_code != 200:
            return None

        items = resp.json().get("items", [])
        if not items:
            return None

        published = items[0].get("snippet", {}).get("publishedAt")
        return _parse_date(published)
