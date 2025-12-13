"""
Vercel Serverless Entry Point for FastAPI
"""
import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from contextlib import asynccontextmanager

# Import routers and config
from app.routers import auth, campaigns, templates, smtp, uploads, stats
from app.core.config import settings
from app.core.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="NovaMailer API", 
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["campaigns"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(smtp.router, prefix="/api/v1/smtp", tags=["smtp"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["uploads"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])

@app.get("/api")
async def root():
    return {"message": "Welcome to NovaMailer API"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Vercel serverless handler
handler = Mangum(app, lifespan="auto")
