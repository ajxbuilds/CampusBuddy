import sys
import os
sys.path.insert(0, os.path.abspath('backend'))
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.api.auth import get_parent_link_code

async def test_get():
    async with AsyncSessionLocal() as db:
        user = User(id=3, role="STUDENT") # Need a valid role enum
        try:
            res = await get_parent_link_code(current_user=user, db=db)
            print(res)
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test_get())
