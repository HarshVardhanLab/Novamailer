from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Use get_database_url() to handle PostgreSQL URL conversion
database_url = settings.get_database_url()

# Disable prepared statements for Supabase connection pooler (pgbouncer)
connect_args = {}
if "supabase" in database_url or "pooler" in database_url:
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

engine = create_async_engine(
    database_url, 
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
