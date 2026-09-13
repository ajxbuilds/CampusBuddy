import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import ParentLinkCode

async def list_codes():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ParentLinkCode))
        codes = res.scalars().all()
        for c in codes:
            print(f"Code ID: {c.id}, Student ID: {c.student_id}, Code: {c.code}")

asyncio.run(list_codes())
