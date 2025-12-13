"""Create all tables in Supabase database"""
import asyncio
from app.core.database import engine, Base
from app.models import user, otp, smtp, campaign, template, recipient, attachment

async def create_tables():
    print("Connecting to Supabase...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created in Supabase!")

if __name__ == "__main__":
    asyncio.run(create_tables())
