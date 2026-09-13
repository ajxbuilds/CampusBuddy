import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def find_dean():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role}")

asyncio.run(find_dean())
