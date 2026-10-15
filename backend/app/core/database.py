from datetime import datetime, timezone
from typing import AsyncGenerator

from sqlalchemy import event
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

def utcnow() -> datetime:
    """Return timezone-naive UTC datetime for PostgreSQL/asyncpg compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

database_url = make_url(settings.DATABASE_URL)
connect_args = {}

engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,  # Recommended for remote DBs to handle disconnects securely
}

if database_url.drivername in ("postgres", "postgresql", "postgresql+asyncpg"):
    database_url = database_url.set(drivername="postgresql+asyncpg")
    query = dict(database_url.query)
    query.pop("sslmode", None)
    query.pop("channel_binding", None)
    query.pop("options", None)

    # Handle Supabase Transaction Pooler specifically
    # Supabase's transaction pooler (port 6543) does not support prepared statements properly with asyncpg out-of-the-box
    host = database_url.host or ""
    port = database_url.port

    if "supabase" in host or port == 6543:
        connect_args["prepared_statement_cache_size"] = 0
        connect_args["statement_cache_size"] = 0

    database_url = database_url.set(query=query)

    import ssl
    # Use a permissive SSL context for Supabase/Render remote connections if needed,
    # but "require" string works for asyncpg natively in most cases.
    connect_args["ssl"] = "require"

engine = create_async_engine(
    database_url,
    connect_args=connect_args,
    **engine_kwargs
)

def _sanitize_param(p):
    if isinstance(p, datetime) and p.tzinfo is not None:
        return p.astimezone(timezone.utc).replace(tzinfo=None)
    return p

def _sanitize_parameters(parameters):
    if not parameters:
        return parameters
    if isinstance(parameters, tuple):
        return tuple(_sanitize_param(p) for p in parameters)
    elif isinstance(parameters, list):
        if parameters and isinstance(parameters[0], (list, tuple)):
            return [tuple(_sanitize_param(p) for p in row) for row in parameters]
        elif parameters and isinstance(parameters[0], dict):
            return [{k: _sanitize_param(v) for k, v in row.items()} for row in parameters]
        return [_sanitize_param(p) for p in parameters]
    elif isinstance(parameters, dict):
        return {k: _sanitize_param(v) for k, v in parameters.items()}
    return parameters

@event.listens_for(engine.sync_engine, "before_cursor_execute", retval=True)
def _strip_tzinfo_from_datetimes(conn, cursor, statement, parameters, context, executemany):
    """
    Ensure all datetime parameters sent to PostgreSQL/asyncpg are offset-naive.
    Prevents asyncpg's 'can't subtract offset-naive and offset-aware datetimes' error
    when inserting into TIMESTAMP WITHOUT TIME ZONE columns.
    """
    if parameters:
        parameters = _sanitize_parameters(parameters)
    return statement, parameters

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
