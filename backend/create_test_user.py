import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User

async def create_user():
    async with AsyncSessionLocal() as session:
        # Check if user exists
        user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Admin Test",
            is_active=True,
            email_verified=True
        )
        session.add(user)
        try:
            await session.commit()
            print("Test user admin@example.com created with password123")
        except Exception as e:
            print("Error creating user:", e)

if __name__ == "__main__":
    asyncio.run(create_user())
