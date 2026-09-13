import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.community import CommunityPost

async def list_posts():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(CommunityPost))
        posts = res.scalars().all()
        for p in posts:
            print(f"Post ID: {p.id}, Title: {p.title}, Author ID: {p.author_id}")

asyncio.run(list_posts())
