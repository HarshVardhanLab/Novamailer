import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routers import auth, campaigns, templates, smtp, uploads, stats
from app.routers import tracking, unsubscribe, webhooks, recipient_lists
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal


async def run_scheduler():
    """Background task: dispatch scheduled campaigns every 60 seconds."""
    while True:
        await asyncio.sleep(60)
        try:
            async with AsyncSessionLocal() as db:
                from sqlalchemy import select
                from app.models.campaign import Campaign

                now = datetime.utcnow()
                result = await db.execute(
                    select(Campaign).filter(
                        Campaign.status == "scheduled",
                        Campaign.scheduled_at <= now,
                    )
                )
                due = result.scalars().all()
                for campaign in due:
                    campaign.status = "pending_send"
                    await db.commit()
                    print(f"[Scheduler] Campaign {campaign.id} '{campaign.name}' queued for sending")
        except Exception as e:
            print(f"[Scheduler] Error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    task = asyncio.create_task(run_scheduler())
    yield
    task.cancel()


app = FastAPI(title="NovaMailer API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(campaigns.router, prefix=f"{settings.API_V1_STR}/campaigns", tags=["campaigns"])
app.include_router(templates.router, prefix=f"{settings.API_V1_STR}/templates", tags=["templates"])
app.include_router(smtp.router, prefix=f"{settings.API_V1_STR}/smtp", tags=["smtp"])
app.include_router(uploads.router, prefix=f"{settings.API_V1_STR}/uploads", tags=["uploads"])
app.include_router(stats.router, prefix=f"{settings.API_V1_STR}/stats", tags=["stats"])

# New feature routers
app.include_router(tracking.router, prefix=f"{settings.API_V1_STR}/track", tags=["tracking"])
app.include_router(unsubscribe.router, prefix=f"{settings.API_V1_STR}/unsubscribe", tags=["unsubscribe"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])
app.include_router(recipient_lists.router, prefix=f"{settings.API_V1_STR}/lists", tags=["recipient-lists"])


@app.get("/")
async def root():
    return {"message": "Welcome to NovaMailer API v2"}


@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "ok"}


handler = Mangum(app, lifespan="off")
