"""Async SQLAlchemy engine + session setup for Supabase PostgreSQL.

Replaces the old Motor/AsyncIOMotorClient setup. Reads DATABASE_URL from the
environment (see .env.example) instead of MONGO_URL / DB_NAME.
"""
import os
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool


def _normalize_database_url(url: str) -> str:
    """Ensure the URL uses the asyncpg driver regardless of how it was supplied.

    Supabase's connection strings are typically given as `postgresql://...` or
    `postgres://...`. SQLAlchemy's async engine needs the `+asyncpg` driver suffix.
    """
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalize_database_url(os.environ["DATABASE_URL"])

# NullPool + statement_cache_size=0: Supabase's connection string (particularly the
# "Transaction" pooler mode on port 6543, recommended for serverless deployments like
# Vercel) is backed by PgBouncer, which does not support asyncpg's server-side prepared
# statement cache. Disabling it here avoids "prepared statement already exists" errors.
# NullPool avoids holding connections open across serverless invocations; PgBouncer /
# Supabase's own pooler is what actually pools connections in that scenario.
engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
    },
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    """FastAPI dependency that yields a scoped AsyncSession per request."""
    async with AsyncSessionLocal() as session:
        yield session
