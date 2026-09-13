import asyncio
from sqlalchemy.future import select
from backend.app.core.database import AsyncSessionLocal
from backend.app.models.user import User, ParentLinkCode

async def test_get():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ParentLinkCode))
        codes = res.scalars().all()
        print(codes)
