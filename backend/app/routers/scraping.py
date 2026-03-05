import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.subgenres import get_all_subgenres
from app.database import get_db
from app.models import ScrapeRun
from app.schemas import QuotaOut, ScrapeRunOut, ScrapeStartRequest, SubgenreOut
from app.services.scraper import run_scrape, stop_scrape
from app.services.youtube_api import YouTubeAPI

router = APIRouter(prefix="/scraping", tags=["scraping"])


@router.post("/start", response_model=ScrapeRunOut)
async def start_scraping(body: ScrapeStartRequest, db: AsyncSession = Depends(get_db)):
    run = ScrapeRun(selected_subgenres=body.subgenres)
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Launch as background task
    asyncio.create_task(run_scrape(str(run.id), body.subgenres, body.demo_mode))

    return run


@router.post("/{run_id}/stop")
async def stop_scraping(run_id: UUID, db: AsyncSession = Depends(get_db)):
    success = stop_scrape(str(run_id))
    if not success:
        raise HTTPException(404, "No active scrape with that ID")
    return {"ok": True}


@router.get("/runs", response_model=list[ScrapeRunOut])
async def list_runs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScrapeRun).order_by(ScrapeRun.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@router.get("/subgenres", response_model=list[SubgenreOut])
async def list_subgenres():
    return get_all_subgenres()


@router.get("/quota", response_model=QuotaOut)
async def get_quota(db: AsyncSession = Depends(get_db)):
    api = YouTubeAPI(db)
    used = await api.get_quota_used_today()
    await api.close()
    return QuotaOut(
        used=used,
        limit=settings.daily_quota_limit,
        remaining=max(0, settings.daily_quota_limit - used),
    )
