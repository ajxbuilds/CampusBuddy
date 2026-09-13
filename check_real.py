import asyncio
from sqlalchemy.future import select
from backend.app.core.database import AsyncSessionLocal
from backend.app.models.user import User, ParentLinkCode

async def check_real_db():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.id == 1))
        admin = res.scalars().first()
        print(f"Real DB Admin Name: {admin.full_name}")
        
        try:
            res = await db.execute(select(ParentLinkCode))
            codes = res.scalars().all()
            print(f"Parent Link Codes found: {len(codes)}")
        except Exception as e:
            print(f"Error querying ParentLinkCode: {e}")

asyncio.run(check_real_db())
