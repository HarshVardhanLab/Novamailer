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

# Create simple app first
app = FastAPI(title="NovaMailer API", version="1.0.0")

# Configure CORS - allow all for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to NovaMailer API"}

@app.get("/api")
async def api_root():
    return {"message": "Welcome to NovaMailer API"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Try to import routers - catch errors
try:
    from app.core.config import settings
    from app.routers import auth, campaigns, templates, smtp, uploads, stats
    
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["campaigns"])
    app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
    app.include_router(smtp.router, prefix="/api/v1/smtp", tags=["smtp"])
    app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["uploads"])
    app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])
except Exception as e:
    @app.get("/api/error")
    async def show_error():
        return {"error": str(e)}

# Vercel serverless handler
handler = Mangum(app, lifespan="off")
