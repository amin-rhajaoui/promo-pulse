import asyncio
import logging
import re
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.subgenres import get_keywords_for_subgenres
from app.core.websocket import manager
from app.database import async_session
from app.models import Channel, ScrapeRun
from app.services.parser import ChannelParser
from app.services.scorer import ChannelScorer
from app.services.authenticity import AuthenticityScorer
from app.services.youtube_api import YouTubeAPI

logger = logging.getLogger(__name__)

# Active scrape tasks keyed by run_id
active_tasks: dict[str, asyncio.Event] = {}


async def run_scrape(run_id: str, subgenres: list[str], demo_mode: bool = False):
    """Main scraping orchestrator. Runs as an asyncio task."""
    cancel_event = asyncio.Event()
    active_tasks[run_id] = cancel_event

    async with async_session() as db:
        try:
            keywords = get_keywords_for_subgenres(subgenres)
            if not keywords:
                return

            # Update run to running
            run = await db.get(ScrapeRun, uuid.UUID(run_id))
            if not run:
                return
            run.status = "running"
            run.started_at = datetime.now(timezone.utc)
            run.total_keywords = len(keywords)
            await db.commit()

            await _broadcast_progress(run_id, run)

            if demo_mode:
                await _run_demo(db, run_id, run, keywords, cancel_event)
            else:
                await _run_live(db, run_id, run, keywords, cancel_event)

            # Mark complete
            run.status = "completed"
            run.completed_at = datetime.now(timezone.utc)
            await db.commit()
            await _broadcast_progress(run_id, run)

        except Exception as e:
            logger.exception("Scrape failed")
            run = await db.get(ScrapeRun, uuid.UUID(run_id))
            if run:
                run.status = "failed"
                run.completed_at = datetime.now(timezone.utc)
                await db.commit()
            await manager.broadcast(run_id, {"type": "error", "message": str(e)})
        finally:
            active_tasks.pop(run_id, None)


def _titles_match(search_title: str, detail_title: str) -> bool:
    """Check if the title from search.list roughly matches channels.list.

    YouTube search can return a channel ID that belongs to a different channel.
    We compare normalized titles and require high overlap.
    """
    import re as _re

    def normalize(t: str) -> set[str]:
        # Lowercase, extract alphanumeric tokens of 2+ chars
        return {w for w in _re.findall(r"[a-z0-9]{2,}", t.lower())}

    words_search = normalize(search_title)
    words_detail = normalize(detail_title)
    if not words_search or not words_detail:
        return True  # Can't compare, allow through

    overlap = words_search & words_detail
    # Check overlap from both directions, use the best match
    ratio = max(
        len(overlap) / len(words_search),
        len(overlap) / len(words_detail),
    )
    return ratio >= 0.7


async def _run_live(
    db: AsyncSession, run_id: str, run: ScrapeRun,
    keywords: list[str], cancel_event: asyncio.Event,
):
    """Live scraping using YouTube Data API."""
    api = YouTubeAPI(db)
    parser = ChannelParser()
    seen_ids: set[str] = set()

    try:
        for i, keyword in enumerate(keywords):
            if cancel_event.is_set():
                run.status = "cancelled"
                break

            run.current_keyword = keyword
            run.completed_keywords = i
            await db.commit()
            await _broadcast_progress(run_id, run)

            # Search channels
            results = await api.search_channels(keyword)
            if not results:
                continue

            # Filter new IDs and keep search titles for cross-validation
            new_results = [r for r in results if r["youtube_id"] not in seen_ids]
            new_ids = [r["youtube_id"] for r in new_results]
            search_titles = {r["youtube_id"]: r["title"] for r in new_results}
            if not new_ids:
                continue
            seen_ids.update(new_ids)

            # Get detailed info (batches of 50)
            for batch_start in range(0, len(new_ids), 50):
                batch = new_ids[batch_start:batch_start + 50]
                details = await api.get_channel_details(batch)

                for ch_data in details:
                    # Filter: skip channels with < 10K subscribers
                    if ch_data.get("subscriber_count", 0) < 10_000:
                        continue

                    # Cross-validate: skip if channels.list title doesn't
                    # match the search title (channel ID mismatch)
                    search_title = search_titles.get(ch_data["youtube_id"], "")
                    detail_title = ch_data.get("title", "")
                    if search_title and detail_title:
                        if not _titles_match(search_title, detail_title):
                            logger.warning(
                                "Title mismatch for %s: search='%s' vs detail='%s', skipping",
                                ch_data["youtube_id"], search_title, detail_title,
                            )
                            continue

                    parsed = parser.parse(ch_data.get("description", ""))
                    subgenres_detected = parser.detect_subgenres(
                        ch_data.get("title", ""), ch_data.get("description", "")
                    )
                    score, tier = ChannelScorer.score({
                        **ch_data, **parsed, "subgenres": subgenres_detected,
                    })

                    # Get last upload date and determine buyable status
                    last_upload = await api.get_last_upload_date(ch_data["youtube_id"])
                    one_year_ago = date.today() - timedelta(days=365)
                    is_buyable = last_upload is not None and last_upload < one_year_ago

                    # Authenticity scoring
                    auth_score, auth_label, auth_signals = AuthenticityScorer.score(ch_data)

                    # Promo detection (description only)
                    desc_text = ch_data.get("description", "")
                    is_promo = bool(re.search(
                        r'\b(promo|promotion|spotify)\b', desc_text, re.IGNORECASE,
                    ))

                    # DJ detection (title + description)
                    full_text = ch_data.get("title", "") + " " + desc_text
                    is_dj = bool(re.search(r'\bDJ\b', full_text))

                    await _upsert_channel(db, {
                        **ch_data, **parsed,
                        "subgenres": subgenres_detected,
                        "score": score,
                        "tier": tier,
                        "last_upload_at": last_upload,
                        "is_buyable": is_buyable,
                        "is_promo": is_promo,
                        "is_dj": is_dj,
                        "authenticity_score": auth_score,
                        "authenticity_label": auth_label,
                        "authenticity_signals": auth_signals,
                        "scrape_run_id": uuid.UUID(run_id),
                    })

                    all_emails = parsed["emails_pro"] + parsed["emails_personal"]
                    run.channels_found += 1
                    run.emails_found += len(all_emails)

                quota_used = await api.get_quota_used_today()
                run.quota_used = quota_used
                await db.commit()
                await _broadcast_progress(run_id, run)

            # Small delay between keywords
            await asyncio.sleep(0.5)

        run.completed_keywords = len(keywords)
        await db.commit()
    finally:
        await api.close()


async def _run_demo(
    db: AsyncSession, run_id: str, run: ScrapeRun,
    keywords: list[str], cancel_event: asyncio.Event,
):
    """Demo mode: generate fake channels for testing."""
    parser = ChannelParser()

    all_demo_channels = [
        {
            "youtube_id": f"DEMO_{i:04d}",
            "title": name,
            "custom_url": f"@{name.lower().replace(' ', '')}",
            "description": desc,
            "thumbnail_url": None,
            "country": country,
            "published_at": date(2020, 1, 1),
            "subscriber_count": subs,
            "video_count": vids,
            "view_count": views,
            "last_upload_at": last_upload,
        }
        for i, (name, desc, subs, vids, views, country, last_upload) in enumerate([
            ("Deep Vibes Music", "Deep house mix playlist. Contact: deepvibes@promohouse.com\nhttps://instagram.com/deepvibes\nhttps://soundcloud.com/deepvibes\nSubmit your track: https://forms.gle/demo1", 45000, 320, 12000000, "US", date(2025, 11, 15)),
            ("Tech House Central", "The best tech house mixes 2024. Business: info@techhousecentral.com\nhttps://open.spotify.com/artist/abc123", 28000, 180, 5600000, "GB", date(2026, 1, 20)),
            ("Afro House World", "Afro house music & dj sets. Email us: afroworld@gmail.com", 12000, 95, 1800000, "ZA", date(2025, 8, 5)),
            ("House Music HD", "House music promotion channel.\nhttps://instagram.com/housemusicHD\nhttps://twitter.com/housemusicHD", 150000, 800, 45000000, "US", date(2024, 6, 10)),
            ("Melodic Journey", "Melodic house and techno. Bookings: bookings@melodicjourney.io\nhttps://soundcloud.com/melodicjourney\nSend your demo: https://labelradar.com/melodic", 18500, 60, 920000, "DE", date(2026, 2, 28)),
            ("Underground Selects", "Minimal house & deep tech. Submit: submit@undergroundselects.com\nhttps://instagram.com/undergroundselects\nhttps://tiktok.com/@ugselects", 15200, 110, 450000, "NL", date(2024, 1, 15)),
            ("Soulful Sessions", "Soulful house & gospel house mixes. Contact: soulful@sessions.org\nhttps://facebook.com/soulfulsessions", 23200, 45, 180000, "US", date(2024, 10, 1)),
            ("Latin House Vibes", "Latin house & brazilian house music. latinhouse@gmail.com", 11800, 25, 65000, "BR", date(2023, 5, 20)),
            ("Classic House Radio", "Classic house music, 90s house, old school house, chicago house. info@classichouseradio.com\nhttps://soundcloud.com/classichouse\nhttps://open.spotify.com/artist/xyz789", 92000, 520, 28000000, "US", date(2026, 3, 1)),
            ("Jazzy House Lounge", "Jazzy house & jazz house mixes. Smooth vibes. lounge@jazzyhouse.com\nhttps://instagram.com/jazzyhouselounge", 16700, 78, 890000, "FR", date(2025, 12, 10)),
        ])
    ]

    # Filter: only keep channels with >= 10K subscribers
    demo_channels = [ch for ch in all_demo_channels if ch["subscriber_count"] >= 10_000]

    total_kw = min(len(keywords), 5)
    run.total_keywords = total_kw

    for i in range(total_kw):
        if cancel_event.is_set():
            run.status = "cancelled"
            break

        run.current_keyword = keywords[i] if i < len(keywords) else "demo"
        run.completed_keywords = i
        await db.commit()
        await _broadcast_progress(run_id, run)
        await asyncio.sleep(1)

        # Add 2 channels per keyword step
        for ch_data in demo_channels[i * 2:(i + 1) * 2]:
            parsed = parser.parse(ch_data["description"])
            subgenres_detected = parser.detect_subgenres(ch_data["title"], ch_data["description"])
            score, tier = ChannelScorer.score({
                **ch_data, **parsed, "subgenres": subgenres_detected,
            })

            last_upload = ch_data.get("last_upload_at")
            one_year_ago = date.today() - timedelta(days=365)
            is_buyable = last_upload is not None and last_upload < one_year_ago

            # Authenticity scoring
            auth_score, auth_label, auth_signals = AuthenticityScorer.score(ch_data)

            # Promo detection (description only)
            desc_text = ch_data.get("description", "")
            is_promo = bool(re.search(
                r'\b(promo|promotion|spotify)\b', desc_text, re.IGNORECASE,
            ))

            # DJ detection (title + description)
            full_text = ch_data.get("title", "") + " " + desc_text
            is_dj = bool(re.search(r'\bDJ\b', full_text))

            await _upsert_channel(db, {
                **ch_data, **parsed,
                "subgenres": subgenres_detected,
                "score": score,
                "tier": tier,
                "last_upload_at": last_upload,
                "is_buyable": is_buyable,
                "is_promo": is_promo,
                "is_dj": is_dj,
                "authenticity_score": auth_score,
                "authenticity_label": auth_label,
                "authenticity_signals": auth_signals,
                "scrape_run_id": uuid.UUID(run_id),
            })

            all_emails = parsed["emails_pro"] + parsed["emails_personal"]
            run.channels_found += 1
            run.emails_found += len(all_emails)

        await db.commit()
        await _broadcast_progress(run_id, run)

    run.completed_keywords = total_kw
    await db.commit()


async def _upsert_channel(db: AsyncSession, data: dict):
    """Insert or update a channel."""
    stmt = pg_insert(Channel).values(
        youtube_id=data["youtube_id"],
        title=data["title"],
        custom_url=data.get("custom_url"),
        description=data.get("description"),
        thumbnail_url=data.get("thumbnail_url"),
        country=data.get("country"),
        published_at=data.get("published_at"),
        subscriber_count=data.get("subscriber_count", 0),
        video_count=data.get("video_count", 0),
        view_count=data.get("view_count", 0),
        emails_pro=data.get("emails_pro", []),
        emails_personal=data.get("emails_personal", []),
        social_links=data.get("social_links", {}),
        has_submit_form=data.get("has_submit_form", False),
        submit_urls=data.get("submit_urls", []),
        subgenres=data.get("subgenres", []),
        score=data.get("score", 0),
        tier=data.get("tier"),
        last_upload_at=data.get("last_upload_at"),
        is_buyable=data.get("is_buyable", False),
        is_promo=data.get("is_promo", False),
        is_dj=data.get("is_dj", False),
        authenticity_score=data.get("authenticity_score", 0),
        authenticity_label=data.get("authenticity_label", "unknown"),
        authenticity_signals=data.get("authenticity_signals", {}),
        scrape_run_id=data.get("scrape_run_id"),
    ).on_conflict_do_update(
        index_elements=["youtube_id"],
        set_={
            "title": data["title"],
            "description": data.get("description"),
            "thumbnail_url": data.get("thumbnail_url"),
            "subscriber_count": data.get("subscriber_count", 0),
            "video_count": data.get("video_count", 0),
            "view_count": data.get("view_count", 0),
            "emails_pro": data.get("emails_pro", []),
            "emails_personal": data.get("emails_personal", []),
            "social_links": data.get("social_links", {}),
            "has_submit_form": data.get("has_submit_form", False),
            "submit_urls": data.get("submit_urls", []),
            "subgenres": data.get("subgenres", []),
            "score": data.get("score", 0),
            "tier": data.get("tier"),
            "last_upload_at": data.get("last_upload_at"),
            "is_buyable": data.get("is_buyable", False),
            "is_promo": data.get("is_promo", False),
            "is_dj": data.get("is_dj", False),
            "authenticity_score": data.get("authenticity_score", 0),
            "authenticity_label": data.get("authenticity_label", "unknown"),
            "authenticity_signals": data.get("authenticity_signals", {}),
            "scrape_run_id": data.get("scrape_run_id"),
        },
    )
    await db.execute(stmt)


async def _broadcast_progress(run_id: str, run: ScrapeRun):
    """Broadcast progress to WebSocket clients."""
    await manager.broadcast(run_id, {
        "type": "progress",
        "status": run.status,
        "total_keywords": run.total_keywords,
        "completed_keywords": run.completed_keywords,
        "channels_found": run.channels_found,
        "emails_found": run.emails_found,
        "quota_used": run.quota_used,
        "current_keyword": run.current_keyword,
    })


def stop_scrape(run_id: str) -> bool:
    """Signal a running scrape to stop."""
    event = active_tasks.get(run_id)
    if event:
        event.set()
        return True
    return False
