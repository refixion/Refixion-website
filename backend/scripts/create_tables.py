"""Alternative to running sql/001_initial_schema.sql by hand: creates every table
directly from the SQLAlchemy models via Base.metadata.create_all().

Usage (from the backend/ directory, with DATABASE_URL set in the environment or .env):
    python scripts/create_tables.py

Note: this creates tables/indexes but does not run seed_all() — start the FastAPI app
afterwards (or call `python -c "import asyncio; from seed import seed_all; ..."`,
see README) to populate catalog data and the admin user.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from database import Base, engine
import models  # noqa: F401 — import registers all model classes on Base.metadata


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All tables created (or already existed).")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
