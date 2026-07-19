# Refixion: MongoDB → Supabase PostgreSQL Migration Notes

This document explains what changed, why, and how to stand up the new backend. Read
the "Known, deliberate behavior differences" section before deploying — everything in
it is a conscious tradeoff, not an oversight.

## File map

| File | Purpose |
|---|---|
| `backend/database.py` | Async SQLAlchemy engine + session factory. Reads `DATABASE_URL`. |
| `backend/models.py` | SQLAlchemy ORM models — one per former Mongo collection (16 tables). |
| `backend/schemas.py` | Pydantic request models (unchanged fields — just moved out of `server.py`). |
| `backend/serializers.py` | Explicit `to_dict()` functions so every response matches the old Mongo document shape exactly. |
| `backend/db_utils.py` | Two upsert helpers that reproduce Mongo's `update_one(..., upsert=True)` semantics in Postgres. |
| `backend/auth.py` | JWT + password hashing + `get_current_admin` (was inline in `server.py`). |
| `backend/utils.py` | `now_iso()` / `new_id()` (unchanged from the original). |
| `backend/seed.py` | Full rewrite of `seed_all()` for Postgres. |
| `backend/server.py` | FastAPI app — every route converted, same paths/request/response bodies. |
| `backend/seed_data.py`, `backend/content_seed.py` | **Unchanged** — pure static Python data, never touched Mongo. |
| `backend/sql/001_initial_schema.sql` | Hand-runnable SQL DDL for Supabase's SQL Editor. |
| `backend/alembic/` | Alembic migration setup, with the same schema as an `op.create_table` revision — use this instead of the raw SQL if you want versioned migrations going forward. |
| `backend/scripts/create_tables.py` | Alternative to both of the above: creates tables straight from the SQLAlchemy models. |
| `backend/requirements.txt`, `pyproject.toml` | `motor`/`pymongo` removed; `sqlalchemy[asyncio]`, `asyncpg`, `alembic` added. |
| `backend/.env.example` | `MONGO_URL`/`DB_NAME` replaced with `DATABASE_URL`. |

`wsgi.py`, `api/index.py`, `vercel.json` — **unchanged**. They just import `app` from
`server.py`; nothing about them is Mongo-specific.

## Setting up Supabase

1. Create a Supabase project (or use an existing one) and grab the **Transaction
   pooler** connection string: Project Settings → Database → Connection string →
   `Transaction` tab (port `6543`). This is the one to use for serverless deployments
   like Vercel — it's backed by PgBouncer, which handles many short-lived connections
   far better than a direct Postgres connection would.
2. Create the tables — pick **one** of these three (they produce an identical schema):
   - **Simplest**: open Supabase's SQL Editor and run `backend/sql/001_initial_schema.sql`.
   - **Alembic** (if you want versioned migrations going forward): `cd backend && alembic upgrade head`.
   - **Script**: `cd backend && python scripts/create_tables.py`.
3. Set `DATABASE_URL` in your environment (or `backend/.env`) to that connection string.
4. Start the app once (`uvicorn server:app` locally, or deploy to Vercel as before).
   `seed_all()` runs automatically on FastAPI startup — it creates the admin user (from
   `ADMIN_EMAIL`/`ADMIN_PASSWORD`) and populates the brand/device/repair/warranty/FAQ/
   workshop/site-content/SEO catalog, exactly like the old Mongo version did.

No other setup is required — the frontend needs zero changes, since every endpoint
keeps its exact path, request body, and response body.

## Design decisions worth knowing about

**`id` columns are mostly `String`, not native `UUID`.** Only `users.id` and
`bookings.id` were ever real `uuid4()` strings in the Mongo data. Everything else
(`brands`, `devices`, `repairs`, `part_options`, `warranties`, `repair_methods`,
`faqs`) mixes human-readable seed slugs (`"brand-apple"`, `"rep-screen"`) with
short admin-generated ids (`"dev-a1b2c3d4"`), so a strict UUID column would reject
them. `users.id`/`bookings.id` use Postgres' native `uuid` type; everything else uses
`varchar`.

**JSONB for anything that was a nested list/dict in Mongo.** `warranties.covers`/
`excludes`, `workshop.opening_hours`/`socials`/`closed_days`, and all nine
`site_content` sections (`hero`, `trust`, `how_it_works`, ...) are stored as JSONB
columns. This preserves the exact shape without inventing a rigid relational schema
for content that was always semi-structured, and it's what lets `PUT /admin/site-content`
keep doing a full-section replace exactly like the old Mongo `$set` did.

**Three singleton tables** (`workshop`, `email_settings`, `site_content`) use a fixed
primary key (`"workshop-default"`, `1`, `"site-content-default"`) instead of Mongo's
"just match any document" pattern (`find_one({})`). Behaviorally identical — there's
only ever one row — but avoids any ambiguity a raw `LIMIT 1` query could introduce.

**Foreign keys were added only where they can't break existing admin behavior:**
- `devices.brand_id → brands.id` (brands are never deleted via the API)
- `part_options.device_id → devices.id` **ON DELETE CASCADE** (deleting a device now
  cleans up its part options instead of leaving them orphaned)
- `part_options.repair_id → repairs.id` and `warranties.repair_id → repairs.id`
  (repairs are never deleted via the API)

  Bookings intentionally have **no** foreign keys back to brand/device/repair/method/
  part_option — they store denormalized snapshots (name, price, label copied at
  booking time) specifically so deleting or renaming a device later doesn't touch
  historical bookings. Adding FKs there would have been a behavior change, not a
  neutral migration.

**Repair's legacy `price_eur`/`warranty` fields are preserved as nullable columns.**
`PUT /admin/repairs/{id}` has always whitelisted these two field names even though the
seeded catalog never sets them — because Mongo is schemaless, an admin PUT could
silently attach them to a document, and a later `GET /repairs` would then include
them. Kept as nullable columns so that quirky-but-real behavior survives.

**`price_overrides` is preserved as inert.** The existing test suite documents that
this table is legacy — it's admin-manageable via CRUD but never actually applied to
computed prices anywhere. Migrated as-is, unchanged behavior, not "fixed."

## Known, deliberate behavior differences

These are the only two places the new backend can behave differently from the old one,
and both are strict improvements rather than regressions:

1. **Invalid foreign keys now return `400` instead of silently succeeding.**
   E.g. `POST /admin/devices` with a `brand_id` that doesn't exist would previously
   insert a Mongo document with a dangling reference; it now raises `400 Ongeldig merk`
   (caught via `IntegrityError` → friendly message, not a raw `500`). Same idea for
   part options/warranties referencing a nonexistent device/repair. This only affects
   malformed admin requests — every valid request behaves identically.

2. **`reviews` schema is inferred, not copied.** The original `REVIEWS` seed list is
   empty and there's no admin create/update/delete endpoint for reviews anywhere in
   the old code — only the public `GET /reviews` aggregation, which only ever touches
   `rating` and `date`. There's no historical document to copy an exact field list
   from. The `reviews` table (`id`, `author_name`, `rating`, `text`, `date`, `source`)
   is a reasonable inference from that usage plus the fields any review display would
   need. If you have a different real-world reviews shape in mind, it's a one-file
   change (`models.py` + `serializers.py`).

Everything else — every endpoint's path, request body, response body, status codes,
sort order, and error messages — was verified line-by-line against the original
`server.py` and the existing `backend/tests/*.py` integration suite (which hits the
API over HTTP and needed **zero** changes, since it was never Mongo-coupled).

## Running the existing tests

Unchanged: `cd backend && pytest`. The suite talks to the running API over HTTP, not
to the database directly, so it works against the new backend exactly as it did
against the old one — it's effectively the regression suite for this migration.
