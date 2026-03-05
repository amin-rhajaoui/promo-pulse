from fastapi import APIRouter, Depends
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Channel, ScrapeRun
from app.schemas import StatsOut

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=StatsOut)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Total channels
    total = (await db.execute(select(func.count(Channel.id)))).scalar_one()

    # Channels with email
    with_email = (await db.execute(
        select(func.count(Channel.id)).where(
            or_(
                func.array_length(Channel.emails_pro, 1) > 0,
                func.array_length(Channel.emails_personal, 1) > 0,
            )
        )
    )).scalar_one()

    # Average score
    avg_score = (await db.execute(
        select(func.coalesce(func.avg(Channel.score), 0))
    )).scalar_one()

    # Total runs
    total_runs = (await db.execute(select(func.count(ScrapeRun.id)))).scalar_one()

    # Count all emails (pro + personal)
    pro_count = (await db.execute(
        select(func.coalesce(func.sum(func.array_length(Channel.emails_pro, 1)), 0))
    )).scalar_one()
    personal_count = (await db.execute(
        select(func.coalesce(func.sum(func.array_length(Channel.emails_personal, 1)), 0))
    )).scalar_one()
    total_emails = pro_count + personal_count

    # Tier distribution
    tier_result = await db.execute(
        select(Channel.tier, func.count(Channel.id))
        .where(Channel.tier.isnot(None))
        .group_by(Channel.tier)
    )
    tier_distribution = {row[0]: row[1] for row in tier_result.all()}

    # Subgenre distribution (unnest array)
    subgenre_result = await db.execute(
        select(
            func.unnest(Channel.subgenres).label("subgenre"),
            func.count().label("cnt"),
        ).group_by("subgenre").order_by(func.count().desc())
    )
    subgenre_distribution = {row[0]: row[1] for row in subgenre_result.all()}

    # Score distribution (buckets of 10)
    score_result = await db.execute(
        select(
            case(
                (Channel.score < 10, "0-9"),
                (Channel.score < 20, "10-19"),
                (Channel.score < 30, "20-29"),
                (Channel.score < 40, "30-39"),
                (Channel.score < 50, "40-49"),
                (Channel.score < 60, "50-59"),
                (Channel.score < 70, "60-69"),
                (Channel.score < 80, "70-79"),
                (Channel.score < 90, "80-89"),
                else_="90-100",
            ).label("bucket"),
            func.count().label("cnt"),
        ).group_by("bucket")
    )
    score_distribution = {row[0]: row[1] for row in score_result.all()}

    return StatsOut(
        total_channels=total,
        channels_with_email=with_email,
        avg_score=round(float(avg_score), 1),
        total_runs=total_runs,
        total_emails=total_emails,
        tier_distribution=tier_distribution,
        subgenre_distribution=subgenre_distribution,
        score_distribution=score_distribution,
    )
