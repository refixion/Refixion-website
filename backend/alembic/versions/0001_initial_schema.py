"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-19

Mirrors backend/models.py and sql/001_initial_schema.sql exactly. Use this if you'd
rather manage schema changes through Alembic than by hand-running SQL in Supabase's
SQL Editor. Both paths produce an identical schema — pick one, don't run both.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String, nullable=False, unique=True),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("role", sa.String, nullable=False, server_default="admin"),
        sa.Column("created_at", sa.Text, nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "brands",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("slug", sa.String, nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("order", sa.Integer, nullable=False, server_default="1"),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "devices",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("brand_id", sa.String, sa.ForeignKey("brands.id"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("popular", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("order", sa.Integer, nullable=False, server_default="99"),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_devices_brand_id", "devices", ["brand_id"])

    op.create_table(
        "repairs",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("duration_minutes", sa.Integer, nullable=False, server_default="30"),
        sa.Column("icon", sa.String, nullable=False, server_default=""),
        sa.Column("order", sa.Integer, nullable=False, server_default="1"),
        sa.Column("has_quality_tiers", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("on_request", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("price_eur", sa.Float, nullable=True),
        sa.Column("warranty", sa.Text, nullable=True),
    )

    op.create_table(
        "part_options",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("device_id", sa.String, sa.ForeignKey("devices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("repair_id", sa.String, sa.ForeignKey("repairs.id"), nullable=False),
        sa.Column("quality_key", sa.String, nullable=False),
        sa.Column("quality_label", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("price_eur", sa.Float, nullable=True),
        sa.Column("on_request", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("warranty_days", sa.Integer, nullable=False, server_default="365"),
        sa.Column("warranty_label", sa.String, nullable=False, server_default="12 maanden garantie"),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("order", sa.Integer, nullable=False, server_default="1"),
    )
    op.create_index("ix_part_options_device_id", "part_options", ["device_id"])
    op.create_index("ix_part_options_repair_id", "part_options", ["repair_id"])

    op.create_table(
        "warranties",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("repair_id", sa.String, sa.ForeignKey("repairs.id"), nullable=False),
        sa.Column("quality_key", sa.String, nullable=False, server_default="standard"),
        sa.Column("label", sa.String, nullable=False),
        sa.Column("warranty_days", sa.Integer, nullable=False),
        sa.Column("warranty_label", sa.String, nullable=False),
        sa.Column("covers", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("excludes", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("order", sa.Integer, nullable=False, server_default="1"),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_warranties_repair_id", "warranties", ["repair_id"])

    op.create_table(
        "repair_methods",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("slug", sa.String, nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("icon", sa.String, nullable=False, server_default=""),
        sa.Column("estimated_turnaround", sa.String, nullable=False, server_default=""),
        sa.Column("additional_price", sa.Float, nullable=False, server_default="0"),
        sa.Column("info", sa.Text, nullable=False, server_default=""),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("order", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "workshop",
        sa.Column("id", sa.String, primary_key=True, server_default="workshop-default"),
        sa.Column("business_name", sa.String, nullable=False),
        sa.Column("workshop_name", sa.String, nullable=False),
        sa.Column("address", sa.String, nullable=False),
        sa.Column("postal_code", sa.String, nullable=False),
        sa.Column("city", sa.String, nullable=False),
        sa.Column("country", sa.String, nullable=False),
        sa.Column("email", sa.String, nullable=False),
        sa.Column("phone", sa.String, nullable=False),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("google_maps_link", sa.Text, nullable=False, server_default=""),
        sa.Column("parking_instructions", sa.Text, nullable=False, server_default=""),
        sa.Column("doorbell_instructions", sa.Text, nullable=False, server_default=""),
        sa.Column("opening_hours", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("closed_days", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("max_bookings_per_day", sa.Integer, nullable=False, server_default="20"),
        sa.Column("appointment_interval_minutes", sa.Integer, nullable=False, server_default="30"),
        sa.Column("socials", postgresql.JSONB, nullable=False, server_default="{}"),
    )

    op.create_table(
        "reviews",
        sa.Column("id", sa.String, primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("author_name", sa.String, nullable=False, server_default=""),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("text", sa.Text, nullable=False, server_default=""),
        sa.Column("date", sa.String, nullable=False),
        sa.Column("source", sa.String, nullable=True),
    )

    op.create_table(
        "faqs",
        sa.Column("id", sa.String, primary_key=True, server_default=sa.text("gen_random_uuid()::text")),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("answer", sa.Text, nullable=False),
        sa.Column("order", sa.Integer, nullable=False, server_default="99"),
    )

    op.create_table(
        "settings",
        sa.Column("key", sa.String, primary_key=True),
        sa.Column("value", sa.Text, nullable=False, server_default=""),
    )

    op.create_table(
        "email_settings",
        sa.Column("id", sa.Integer, primary_key=True, server_default="1"),
        sa.Column("smtp_host", sa.String, nullable=False),
        sa.Column("smtp_port", sa.Integer, nullable=False),
        sa.Column("smtp_username", sa.String, nullable=False, server_default=""),
        sa.Column("smtp_password", sa.Text, nullable=False, server_default=""),
        sa.Column("sender_name", sa.String, nullable=False, server_default="Refixion"),
        sa.Column("sender_email", sa.String, nullable=False, server_default=""),
        sa.Column("reply_to", sa.String, nullable=True),
        sa.Column("use_tls", sa.Boolean, nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "site_content",
        sa.Column("id", sa.String, primary_key=True, server_default="site-content-default"),
        sa.Column("hero", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("trust", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("how_it_works", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("brands_section", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("why", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("reviews_section", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("faq_section", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("cta", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("footer", postgresql.JSONB, nullable=False, server_default="{}"),
    )

    op.create_table(
        "seo",
        sa.Column("path", sa.String, primary_key=True),
        sa.Column("title", sa.String, nullable=False, server_default=""),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("og_title", sa.String, nullable=False, server_default=""),
        sa.Column("og_description", sa.Text, nullable=False, server_default=""),
        sa.Column("og_image", sa.Text, nullable=False, server_default=""),
    )

    op.create_table(
        "price_overrides",
        sa.Column("device_id", sa.String, primary_key=True),
        sa.Column("repair_id", sa.String, primary_key=True),
        sa.Column("price_eur", sa.Float, nullable=False),
    )

    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("reference", sa.String, nullable=False),
        sa.Column("brand_id", sa.String, nullable=False),
        sa.Column("brand_name", sa.String, nullable=False),
        sa.Column("device_id", sa.String, nullable=False),
        sa.Column("device_name", sa.String, nullable=False),
        sa.Column("repair_id", sa.String, nullable=False),
        sa.Column("repair_name", sa.String, nullable=False),
        sa.Column("part_option_id", sa.String, nullable=True),
        sa.Column("part_quality_key", sa.String, nullable=True),
        sa.Column("part_quality_label", sa.String, nullable=True),
        sa.Column("warranty_days", sa.Integer, nullable=True),
        sa.Column("warranty_label", sa.String, nullable=True),
        sa.Column("method_id", sa.String, nullable=False),
        sa.Column("method_title", sa.String, nullable=False),
        sa.Column("appointment_date", sa.String, nullable=False),
        sa.Column("appointment_time", sa.String, nullable=False),
        sa.Column("first_name", sa.String, nullable=False),
        sa.Column("last_name", sa.String, nullable=False),
        sa.Column("email", sa.String, nullable=False),
        sa.Column("phone", sa.String, nullable=False),
        sa.Column("street", sa.String, nullable=False),
        sa.Column("house_number", sa.String, nullable=False),
        sa.Column("postal_code", sa.String, nullable=False),
        sa.Column("city", sa.String, nullable=False),
        sa.Column("notes", sa.Text, nullable=False, server_default=""),
        sa.Column("duration_minutes", sa.Integer, nullable=False, server_default="60"),
        sa.Column("price_eur", sa.Float, nullable=False, server_default="0"),
        sa.Column("on_request", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("additional_price", sa.Float, nullable=False, server_default="0"),
        sa.Column("total_price", sa.Float, nullable=False, server_default="0"),
        sa.Column("status", sa.String, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.String, nullable=False),
        sa.Column("updated_at", sa.String, nullable=True),
        sa.Column("ip", sa.String, nullable=False, server_default=""),
        sa.Column("user_agent", sa.Text, nullable=False, server_default=""),
    )
    op.create_index("ix_bookings_reference", "bookings", ["reference"])
    op.create_index("ix_bookings_status", "bookings", ["status"])
    op.create_index("ix_bookings_appointment_date", "bookings", ["appointment_date"])
    op.create_index("ix_bookings_created_at", "bookings", ["created_at"])
    op.create_index("ix_bookings_date_status", "bookings", ["appointment_date", "status"])


def downgrade() -> None:
    op.drop_table("bookings")
    op.drop_table("price_overrides")
    op.drop_table("seo")
    op.drop_table("site_content")
    op.drop_table("email_settings")
    op.drop_table("settings")
    op.drop_table("faqs")
    op.drop_table("reviews")
    op.drop_table("workshop")
    op.drop_table("repair_methods")
    op.drop_table("warranties")
    op.drop_table("part_options")
    op.drop_table("repairs")
    op.drop_table("devices")
    op.drop_table("brands")
    op.drop_table("users")
