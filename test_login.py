import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.user import User
from app.core.security import verify_password
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.get_database_url())
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    email = "test@example.com"
    password = "password123"
    
    async with async_session() as session:
        result = await session.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        if not user:
            print("User not found!")
            return
            
        print(f"Found user: {user.email}")
        print(f"Hashed password in DB: {user.hashed_password}")
        
        is_valid = verify_password(password, user.hashed_password)
        print(f"Password is valid: {is_valid}")
        print(f"Email verified: {user.email_verified}")
        print(f"Is active: {user.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
