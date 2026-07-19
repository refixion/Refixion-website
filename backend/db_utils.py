"""Small helpers that give Postgres/SQLAlchemy the same two upsert semantics the old
Mongo seeding code relied on:

  * Mongo `update_one({...}, {"$set": doc}, upsert=True)`
    -> `upsert_set()`: INSERT ... ON CONFLICT (key) DO UPDATE SET <all other columns>
       Always overwrites on conflict.

  * Mongo `update_one({...}, {"$setOnInsert": doc}, upsert=True)`
    -> `upsert_insert_only()`: INSERT ... ON CONFLICT (key) DO NOTHING
       Only inserts if missing; never touches an existing row. This is how the seed
       data avoids clobbering admin edits (part_options, warranties, repair_methods).
"""
from typing import Iterable, Type

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession


async def upsert_set(
    session: AsyncSession,
    model: Type,
    values: dict,
    index_elements: Iterable[str],
    set_fields: Iterable[str] | None = None,
) -> None:
    """Insert `values`, or update the conflicting row's `set_fields` (default: every
    column except the conflict key) if a row with the same key already exists."""
    index_elements = list(index_elements)
    stmt = pg_insert(model).values(**values)
    cols = set_fields if set_fields is not None else [c.name for c in model.__table__.columns if c.name not in index_elements]
    if cols:
        stmt = stmt.on_conflict_do_update(
            index_elements=index_elements,
            set_={c: getattr(stmt.excluded, c) for c in cols},
        )
    else:
        stmt = stmt.on_conflict_do_nothing(index_elements=index_elements)
    await session.execute(stmt)


async def upsert_insert_only(
    session: AsyncSession,
    model: Type,
    values: dict,
    index_elements: Iterable[str],
) -> None:
    """Insert `values` only if no row with the same key already exists; otherwise no-op."""
    stmt = pg_insert(model).values(**values).on_conflict_do_nothing(index_elements=list(index_elements))
    await session.execute(stmt)
