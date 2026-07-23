"""SQLAlchemy ORM models — one per former Mongo collection.

Design notes (read before changing anything):

* Most `id` columns are plain String, NOT a native UUID type. In the original Mongo
  data, only `users.id` and `bookings.id` are always real uuid4 strings. Everything
  else (`brands`, `devices`, `repairs`, `part_options`, `warranties`, `repair_methods`,
  `faqs`, `workshop`) mixes human-readable seed slugs ("brand-apple", "rep-screen") with
  short admin-generated ids ("dev-a1b2c3d4"), so a native UUID column would reject them.
  `users.id` / `bookings.id` use Postgres' native UUID type (as string) since those are
  always genuine UUIDs.

* Fields that are lists/dicts in Mongo (covers, excludes, opening_hours, socials,
  site content sections, etc.) are stored as JSONB. This preserves exact shape and
  avoids inventing a rigid relational schema for content that was always
  semi-structured.

* `created_at` / `appointment_date` / `appointment_time` are kept as plain TEXT,
  because the original code already stores them as pre-formatted strings
  (`now_iso()`, "YYYY-MM-DD", "HH:MM") and the API must keep returning byte-identical
  strings — not re-derived date/datetime formatting.

* Foreign keys are only added where they can't break existing admin behavior:
    - devices.brand_id -> brands.id            (brands are never deleted via the API)
    - part_options.device_id -> devices.id     (ON DELETE CASCADE: deleting a device
      should take its part options with it; no existing code depends on orphaned
      part_options surviving a device delete)
    - part_options.repair_id -> repairs.id     (repairs are never deleted via the API)
    - warranties.repair_id -> repairs.id       (same reasoning)
  Booking rows intentionally do NOT have FKs back to brand/device/repair/method/
  part_option: bookings store denormalized snapshots (name/price/label copied at
  booking time) precisely so that deleting or renaming a device/repair later doesn't
  affect historical bookings — enforcing FKs here would be a behavior change, not a
  neutral migration.
"""
import uuid

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


# ------- users -------
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, default="admin")
    created_at: Mapped[str] = mapped_column(Text, nullable=False)


# ------- brands -------
class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    devices: Mapped[list["Device"]] = relationship(back_populates="brand")


# ------- devices -------
class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    brand_id: Mapped[str] = mapped_column(ForeignKey("brands.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    popular: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=99)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    brand: Mapped["Brand"] = relationship(back_populates="devices")
    part_options: Mapped[list["PartOption"]] = relationship(back_populates="device", cascade="all, delete-orphan")


# ------- repairs -------
class Repair(Base):
    __tablename__ = "repairs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    icon: Mapped[str] = mapped_column(String, nullable=False, default="")
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    has_quality_tiers: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    on_request: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Legacy free-form fields: the old admin_update_repair endpoint whitelists
    # "price_eur" and "warranty" even though the seeded catalog never sets them.
    # Mongo being schemaless meant an admin PUT could silently attach these to a
    # document; kept here (nullable, unused by seeding) so that behavior isn't lost.
    price_eur: Mapped[float | None] = mapped_column(Float, nullable=True)
    warranty: Mapped[str | None] = mapped_column(Text, nullable=True)

    part_options: Mapped[list["PartOption"]] = relationship(back_populates="repair")
    warranties: Mapped[list["Warranty"]] = relationship(back_populates="repair")


# ------- part_options -------
class PartOption(Base):
    __tablename__ = "part_options"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    device_id: Mapped[str] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    repair_id: Mapped[str] = mapped_column(ForeignKey("repairs.id"), nullable=False, index=True)
    quality_key: Mapped[str] = mapped_column(String, nullable=False)
    quality_label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    price_eur: Mapped[float | None] = mapped_column(Float, nullable=True)
    on_request: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    warranty_days: Mapped[int] = mapped_column(Integer, nullable=False, default=365)
    warranty_label: Mapped[str] = mapped_column(String, nullable=False, default="12 maanden garantie")
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    device: Mapped["Device"] = relationship(back_populates="part_options")
    repair: Mapped["Repair"] = relationship(back_populates="part_options")


# ------- warranties (per-repair catalog) -------
class Warranty(Base):
    __tablename__ = "warranties"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    repair_id: Mapped[str] = mapped_column(ForeignKey("repairs.id"), nullable=False, index=True)
    quality_key: Mapped[str] = mapped_column(String, nullable=False, default="standard")
    label: Mapped[str] = mapped_column(String, nullable=False)
    warranty_days: Mapped[int] = mapped_column(Integer, nullable=False)
    warranty_label: Mapped[str] = mapped_column(String, nullable=False)
    covers: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    excludes: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    repair: Mapped["Repair"] = relationship(back_populates="warranties")


# ------- repair_methods -------
class RepairMethod(Base):
    __tablename__ = "repair_methods"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    icon: Mapped[str] = mapped_column(String, nullable=False, default="")
    estimated_turnaround: Mapped[str] = mapped_column(String, nullable=False, default="")
    additional_price: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    info: Mapped[str] = mapped_column(Text, nullable=False, default="")
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


# ------- workshop (singleton row) -------
class Workshop(Base):
    __tablename__ = "workshop"

    id: Mapped[str] = mapped_column(String, primary_key=True, default="workshop-default")
    business_name: Mapped[str] = mapped_column(String, nullable=False)
    workshop_name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    postal_code: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    google_maps_link: Mapped[str] = mapped_column(Text, nullable=False, default="")
    parking_instructions: Mapped[str] = mapped_column(Text, nullable=False, default="")
    doorbell_instructions: Mapped[str] = mapped_column(Text, nullable=False, default="")
    opening_hours: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    closed_days: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    max_bookings_per_day: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    appointment_interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    socials: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)


# ------- reviews -------
# NOTE: the original REVIEWS seed list is empty and there is no admin create/update/
# delete endpoint for reviews anywhere in server.py — only the public GET /reviews
# aggregation (which only ever touches `rating` and `date`). There is no historical
# document to copy an exact field list from, so this schema is a reasonable, minimal
# inference from how the field is consumed (rating + date) plus the fields any review
# display would obviously need (author, text). Flagged here in case you have a
# different real-world reviews shape you want instead.
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    author_name: Mapped[str] = mapped_column(String, nullable=False, default="")
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    date: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str | None] = mapped_column(String, nullable=True)


# ------- faqs -------
class Faq(Base):
    __tablename__ = "faqs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=99)


# ------- settings (generic key/value store, e.g. general_warranty_text) -------
class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")


# ------- email_settings (singleton row; original Mongo doc has no id field) -------
class EmailSettings(Base):
    __tablename__ = "email_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    smtp_host: Mapped[str] = mapped_column(String, nullable=False)
    smtp_port: Mapped[int] = mapped_column(Integer, nullable=False)
    smtp_username: Mapped[str] = mapped_column(String, nullable=False, default="")
    smtp_password: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sender_name: Mapped[str] = mapped_column(String, nullable=False, default="Refixion")
    sender_email: Mapped[str] = mapped_column(String, nullable=False, default="")
    reply_to: Mapped[str | None] = mapped_column(String, nullable=True)
    use_tls: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


# ------- site_content (singleton row; one JSONB column per top-level section) -------
class SiteContent(Base):
    __tablename__ = "site_content"

    id: Mapped[str] = mapped_column(String, primary_key=True, default="site-content-default")
    hero: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    trust: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    how_it_works: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    brands_section: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    why: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    reviews_section: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    faq_section: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    cta: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    footer: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    SECTION_KEYS = (
        "hero", "trust", "how_it_works", "brands_section", "why",
        "reviews_section", "faq_section", "cta", "footer",
    )


# ------- seo (path is the natural key — original Mongo docs have no separate id) -------
class Seo(Base):
    __tablename__ = "seo"

    path: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    og_title: Mapped[str] = mapped_column(String, nullable=False, default="")
    og_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    og_image: Mapped[str] = mapped_column(Text, nullable=False, default="")


# ------- price_overrides (legacy/inert — see server.py comment near the endpoints) -------
class PriceOverride(Base):
    __tablename__ = "price_overrides"
    # No separate UniqueConstraint needed: the composite primary key below
    # (device_id, repair_id) already enforces this.

    device_id: Mapped[str] = mapped_column(String, primary_key=True)
    repair_id: Mapped[str] = mapped_column(String, primary_key=True)
    price_eur: Mapped[float] = mapped_column(Float, nullable=False)


# ------- bookings -------
class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference: Mapped[str] = mapped_column(String, nullable=False, index=True)

    brand_id: Mapped[str] = mapped_column(String, nullable=False)
    brand_name: Mapped[str] = mapped_column(String, nullable=False)
    device_id: Mapped[str] = mapped_column(String, nullable=False)
    device_name: Mapped[str] = mapped_column(String, nullable=False)
    repair_id: Mapped[str] = mapped_column(String, nullable=False)
    repair_name: Mapped[str] = mapped_column(String, nullable=False)

    part_option_id: Mapped[str | None] = mapped_column(String, nullable=True)
    part_quality_key: Mapped[str | None] = mapped_column(String, nullable=True)
    part_quality_label: Mapped[str | None] = mapped_column(String, nullable=True)
    warranty_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    warranty_label: Mapped[str | None] = mapped_column(String, nullable=True)

    method_id: Mapped[str] = mapped_column(String, nullable=False)
    method_title: Mapped[str] = mapped_column(String, nullable=False)

    appointment_date: Mapped[str] = mapped_column(String, nullable=False, index=True)
    appointment_time: Mapped[str] = mapped_column(String, nullable=False)

    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    street: Mapped[str] = mapped_column(String, nullable=False)
    house_number: Mapped[str] = mapped_column(String, nullable=False)
    postal_code: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")

    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    price_eur: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    on_request: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    additional_price: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    total_price: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    status: Mapped[str] = mapped_column(String, nullable=False, default="pending", index=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, index=True)
    updated_at: Mapped[str | None] = mapped_column(String, nullable=True)

    ip: Mapped[str] = mapped_column(String, nullable=False, default="")
    user_agent: Mapped[str] = mapped_column(Text, nullable=False, default="")


# ------- orders -------
class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    customer_name: Mapped[str] = mapped_column(String, nullable=False)

    email: Mapped[str] = mapped_column(String, nullable=False)

    phone: Mapped[str] = mapped_column(String, nullable=False)

    street: Mapped[str] = mapped_column(String, nullable=False)

    house_number: Mapped[str] = mapped_column(String, nullable=False)

    postal_code: Mapped[str] = mapped_column(String, nullable=False)

    city: Mapped[str] = mapped_column(String, nullable=False)

    total: Mapped[float] = mapped_column(Float, nullable=False)

    payment_status: Mapped[str] = mapped_column(String, nullable=False, default="pending")

    order_status: Mapped[str] = mapped_column(String, nullable=False, default="new")

    created_at: Mapped[str] = mapped_column(Text, nullable=False)


# ------- order_items -------
class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    order_id: Mapped[str] = mapped_column(String, nullable=False, index=True)

    product_id: Mapped[str] = mapped_column(String, nullable=False)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    price: Mapped[float] = mapped_column(Float, nullable=False)

    screenprotector: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    case: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    charger: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
# Composite index matching the actual hot-path query in GET /availability
# (filter by appointment_date, excluding cancelled statuses).
Index("ix_bookings_date_status", Booking.appointment_date, Booking.status)
