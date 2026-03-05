from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import channels, scraping, stats, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Promo Pulse – YouTube House Curator Scraper", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(channels.router, prefix="/api")
app.include_router(scraping.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(ws.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
