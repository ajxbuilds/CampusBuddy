
from typing import AsyncGenerator

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

database_url = make_url(settings.DATABASE_URL)
connect_args = {}

if database_url.drivername in ("postgres", "postgresql"):
    database_url = database_url.set(drivername="postgresql+asyncpg")
    query = dict(database_url.query)
    query.pop("sslmode", None)
    query.pop("channel_binding", None)
    database_url = database_url.set(query=query)
    connect_args["ssl"] = "require"

elif database_url.drivername == "postgresql+asyncpg":
    query = dict(database_url.query)
    query.pop("sslmode", None)
    query.pop("channel_binding", None)
    database_url = database_url.set(query=query)
    connect_args["ssl"] = "require"

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args=connect_args,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
