"""Rewritten seed_all() — PostgreSQL version of the original Mongo seeding logic.

Every step below is a direct translation of one block in the old server.py seed_all().
Comments reference the original Mongo call so the two can be diffed side by side.
"""
import logging
import os

from sqlalchemy import delete, insert, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from auth import hash_password, verify_password
from content_seed import SEO_DEFAULTS, SITE_CONTENT_DEFAULT
from db_utils import upsert_insert_only, upsert_set
from models import (
    Brand,
    Device,
    EmailSettings,
    Faq,
    PartOption,
    Repair,
    RepairMethod,
    Review,
    Seo,
    Setting,
    SiteContent,
    User,
    Warranty,
    Workshop,
)
from seed_data import (
    BRANDS,
    DEVICES,
    FAQS,
    GENERAL_WARRANTY_TEXT,
    REPAIR_METHODS,
    REPAIRS,
    REVIEWS,
    WARRANTIES,
    WORKSHOP,
    build_part_options,
)
from utils import now_iso

logger = logging.getLogger("refixion")


async def _upsert_set_partial(session: AsyncSession, model, always_set: dict, insert_only: dict, index_elements):
    """INSERT with (always_set ∪ insert_only); on conflict, UPDATE only `always_set`
    columns, leaving `insert_only` columns (e.g. `enabled`) untouched on existing rows.

    Mirrors Mongo's `update_one(filter, {"$set": always_set, "$setOnInsert": insert_only}, upsert=True)`.
    """
    values = {**always_set, **insert_only}
    stmt = pg_insert(model).values(**values)
    stmt = stmt.on_conflict_do_update(
        index_elements=list(index_elements),
        set_={c: getattr(stmt.excluded, c) for c in always_set},
    )
    await session.execute(stmt)


async def seed_all(session: AsyncSession) -> None:
    # Original: await db.users.create_index("email", unique=True)
    # Original: await db.bookings.create_index("reference")
    # -> both are now schema-level (see models.py / the DDL script), created once
    #    when the tables are created, not on every startup.

    # ------- admin -------
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = (await session.execute(select(User).where(User.email == admin_email))).scalar_one_or_none()
    if not existing:
        session.add(User(
            email=admin_email,
            password_hash=hash_password(admin_pw),
            name="Refixion Admin",
            role="admin",
            created_at=now_iso(),
        ))
        logger.info("Seeded admin user %s", admin_email)
    else:
        if not verify_password(admin_pw, existing.password_hash):
            existing.password_hash = hash_password(admin_pw)

    # ------- brands — remove deprecated (google/oneplus) -------
    await session.execute(delete(Brand).where(Brand.id.in_(["brand-google", "brand-oneplus"])))
    for b in BRANDS:
        await upsert_set(session, Brand, b, index_elements=["id"])

    # ------- devices — remove ones under deprecated brands + orphans no longer in the seed catalog -------
    await session.execute(delete(Device).where(Device.brand_id.in_(["brand-google", "brand-oneplus"])))
    seed_device_ids = [d["id"] for d in DEVICES]
    await session.execute(
        delete(Device).where(
            Device.brand_id.in_(["brand-apple", "brand-samsung"]),
            Device.id.notin_(seed_device_ids),
        )
    )
    for d in DEVICES:
        await _upsert_set_partial(
            session, Device,
            always_set={"id": d["id"], "brand_id": d["brand_id"], "name": d["name"], "popular": d["popular"], "order": d["order"]},
            insert_only={"enabled": True},
            index_elements=["id"],
        )

    # ------- repairs — upsert catalog (name/description/duration/icon/order from seed; enabled preserved) -------
    for r in REPAIRS:
        always = {"id": r["id"]}
        always.update({k: r[k] for k in ("name", "description", "duration_minutes", "icon", "order", "has_quality_tiers", "on_request")})
        await _upsert_set_partial(session, Repair, always_set=always, insert_only={"enabled": True}, index_elements=["id"])

    # ------- part options — seed only missing ones (never overwrite admin price edits) -------
    for po in build_part_options():
        await upsert_insert_only(session, PartOption, po, index_elements=["id"])

    # ------- warranty catalog (per-repair covers/excludes) -------
    for w in WARRANTIES:
        await upsert_insert_only(session, Warranty, w, index_elements=["id"])

    # ------- general warranty text -------
    await upsert_insert_only(
        session, Setting,
        {"key": "general_warranty_text", "value": GENERAL_WARRANTY_TEXT},
        index_elements=["key"],
    )

    # ------- repair methods — remove deprecated methods, upsert the current set -------
    await session.execute(delete(RepairMethod).where(RepairMethod.id.in_(["method-pickup", "method-onsite"])))
    seed_method_ids = [m["id"] for m in REPAIR_METHODS]
    await session.execute(delete(RepairMethod).where(RepairMethod.id.notin_(seed_method_ids)))
    for m in REPAIR_METHODS:
        await upsert_insert_only(session, RepairMethod, m, index_elements=["id"])

    # ------- workshop — force update to reflect current business details -------
    await upsert_set(session, Workshop, WORKSHOP, index_elements=["id"])

    # ------- reviews — user opted-out of seeded reviews -------
    await session.execute(delete(Review))
    for rv in REVIEWS:
        await upsert_insert_only(session, Review, rv, index_elements=["id"])

    # ------- faqs — force refresh (dedupe + updated copy) -------
    await session.execute(delete(Faq))
    if FAQS:
        await session.execute(insert(Faq), list(FAQS))

    # ------- site content -------
    await upsert_insert_only(session, SiteContent, SITE_CONTENT_DEFAULT, index_elements=["id"])

    # Force-update sections that changed per business request (rating line off, trust cards,
    # why items, footer socials, hero badge). Original used Mongo dot-notation to patch just
    # these nested keys — here we merge into the existing JSONB blobs so sibling keys survive.
    site_content = (await session.execute(select(SiteContent).where(SiteContent.id == SITE_CONTENT_DEFAULT["id"]))).scalar_one_or_none()
    if site_content is not None:
        site_content.hero = {
            **site_content.hero,
            "badge_text": SITE_CONTENT_DEFAULT["hero"]["badge_text"],
            "rating_line_enabled": False,
        }
        site_content.trust = {**site_content.trust, "cards": SITE_CONTENT_DEFAULT["trust"]["cards"]}
        site_content.why = {**site_content.why, "items": SITE_CONTENT_DEFAULT["why"]["items"]}
        site_content.footer = SITE_CONTENT_DEFAULT["footer"]

    # ------- seo defaults — remove deprecated paths, upsert current set -------
    await session.execute(delete(Seo).where(Seo.path.in_(["/about", "/business", "/reviews"])))
    for s in SEO_DEFAULTS:
        await upsert_insert_only(session, Seo, s, index_elements=["path"])

    # ------- email settings — pre-fill defaults for Gmail (no credentials!) if not configured -------
    existing_email = (await session.execute(select(EmailSettings).limit(1))).scalar_one_or_none()
    if not existing_email:
        session.add(EmailSettings(
            id=1,
            smtp_host="smtp.gmail.com",
            smtp_port=587,
            smtp_username="",
            smtp_password="",
            sender_name="Refixion",
            sender_email="",
            reply_to="",
            use_tls=True,
        ))

    await session.commit()
