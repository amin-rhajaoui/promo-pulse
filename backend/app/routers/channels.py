import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Channel
from app.schemas import ChannelListOut, ChannelOut, ChannelUpdateRequest

router = APIRouter(tags=["channels"])


@router.get("/channels", response_model=ChannelListOut)
async def list_channels(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    min_score: int | None = None,
    has_email: bool | None = None,
    is_buyable: bool | None = None,
    subgenre: str | None = None,
    sort_by: str = "score",
    sort_dir: str = "desc",
    db: AsyncSession = Depends(get_db),
):
    query = select(Channel)
    count_query = select(func.count(Channel.id))

    # Filters
    if search:
        like = f"%{search}%"
        filt = or_(Channel.title.ilike(like), Channel.description.ilike(like))
        query = query.where(filt)
        count_query = count_query.where(filt)

    if min_score is not None:
        query = query.where(Channel.score >= min_score)
        count_query = count_query.where(Channel.score >= min_score)

    if has_email is True:
        filt = or_(
            func.array_length(Channel.emails_pro, 1) > 0,
            func.array_length(Channel.emails_personal, 1) > 0,
        )
        query = query.where(filt)
        count_query = count_query.where(filt)

    if is_buyable is not None:
        query = query.where(Channel.is_buyable == is_buyable)
        count_query = count_query.where(Channel.is_buyable == is_buyable)

    if subgenre:
        query = query.where(Channel.subgenres.any(subgenre))
        count_query = count_query.where(Channel.subgenres.any(subgenre))

    # Sorting
    sort_col = getattr(Channel, sort_by, Channel.score)
    if sort_dir == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Total count
    total = (await db.execute(count_query)).scalar_one()

    # Pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return ChannelListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/channels/{channel_id}", response_model=ChannelOut)
async def get_channel(channel_id: UUID, db: AsyncSession = Depends(get_db)):
    channel = await db.get(Channel, channel_id)
    if not channel:
        raise HTTPException(404, "Channel not found")
    return channel


@router.patch("/channels/{channel_id}", response_model=ChannelOut)
async def update_channel(
    channel_id: UUID, body: ChannelUpdateRequest, db: AsyncSession = Depends(get_db),
):
    channel = await db.get(Channel, channel_id)
    if not channel:
        raise HTTPException(404, "Channel not found")
    if body.notes is not None:
        channel.notes = body.notes
    await db.commit()
    await db.refresh(channel)
    return channel


@router.delete("/channels/{channel_id}")
async def delete_channel(channel_id: UUID, db: AsyncSession = Depends(get_db)):
    channel = await db.get(Channel, channel_id)
    if not channel:
        raise HTTPException(404, "Channel not found")
    await db.delete(channel)
    await db.commit()
    return {"ok": True}


@router.get("/export/csv")
async def export_csv(
    min_score: int | None = None,
    has_email: bool | None = None,
    is_buyable: bool | None = None,
    subgenre: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Channel).order_by(Channel.score.desc())

    if min_score is not None:
        query = query.where(Channel.score >= min_score)
    if is_buyable is not None:
        query = query.where(Channel.is_buyable == is_buyable)
    if has_email is True:
        query = query.where(
            or_(
                func.array_length(Channel.emails_pro, 1) > 0,
                func.array_length(Channel.emails_personal, 1) > 0,
            )
        )
    if subgenre:
        query = query.where(Channel.subgenres.any(subgenre))

    result = await db.execute(query)
    channels = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Title", "YouTube ID", "Custom URL", "Subscribers", "Videos",
        "Views", "Score", "Tier", "Emails (Pro)", "Emails (Personal)",
        "Subgenres", "Country", "Has Submit Form", "Submit URLs", "Social Links",
    ])
    for ch in channels:
        writer.writerow([
            ch.title, ch.youtube_id, ch.custom_url or "", ch.subscriber_count,
            ch.video_count, ch.view_count, ch.score, ch.tier or "",
            "; ".join(ch.emails_pro or []), "; ".join(ch.emails_personal or []),
            "; ".join(ch.subgenres or []), ch.country or "",
            "Yes" if ch.has_submit_form else "No",
            "; ".join(ch.submit_urls or []),
            str(ch.social_links or {}),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=channels_export.csv"},
    )


@router.get("/export/emails")
async def export_emails(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Channel.title, Channel.emails_pro, Channel.emails_personal)
        .where(
            or_(
                func.array_length(Channel.emails_pro, 1) > 0,
                func.array_length(Channel.emails_personal, 1) > 0,
            )
        )
        .order_by(Channel.score.desc())
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Channel", "Email", "Type"])
    seen: set[str] = set()
    for title, pro, personal in rows:
        for email in (pro or []):
            if email not in seen:
                writer.writerow([title, email, "pro"])
                seen.add(email)
        for email in (personal or []):
            if email not in seen:
                writer.writerow([title, email, "personal"])
                seen.add(email)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=emails_export.csv"},
    )
