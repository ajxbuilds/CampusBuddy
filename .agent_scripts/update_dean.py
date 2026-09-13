import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def update_dean():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.id == 1))
        admin = res.scalars().first()
        if admin:
            admin.full_name = "Admin"
            await db.commit()
            print("Successfully renamed Admin user to 'Admin'.")

asyncio.run(update_dean())
