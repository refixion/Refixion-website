-- Refixion — initial PostgreSQL schema for Supabase
--
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query),
-- against a fresh database. It creates every table used by the backend, matching
-- backend/models.py exactly. After running this, start the backend once — seed_all()
-- (called on FastAPI startup) will populate the catalog data and create the admin user.
--
-- Safe to re-run: every statement uses IF NOT EXISTS / guards.

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ------- users -------
create table if not exists users (
    id             uuid primary key default gen_random_uuid(),
    email          varchar not null unique,
    password_hash  text not null,
    name           varchar not null,
    role           varchar not null default 'admin',
    created_at     text not null
);
create index if not exists ix_users_email on users (email);

-- ------- brands -------
create table if not exists brands (
    id      varchar primary key,
    slug    varchar not null,
    name    varchar not null,
    "order" integer not null default 1,
    enabled boolean not null default true
);

-- ------- devices -------
create table if not exists devices (
    id       varchar primary key,
    brand_id varchar not null references brands(id),
    name     varchar not null,
    popular  boolean not null default false,
    "order"  integer not null default 99,
    enabled  boolean not null default true
);
create index if not exists ix_devices_brand_id on devices (brand_id);

-- ------- repairs -------
create table if not exists repairs (
    id                varchar primary key,
    name              varchar not null,
    description       text not null default '',
    duration_minutes  integer not null default 30,
    icon              varchar not null default '',
    "order"           integer not null default 1,
    has_quality_tiers boolean not null default false,
    on_request        boolean not null default false,
    enabled           boolean not null default true,
    price_eur         double precision,   -- legacy free-form admin field (nullable)
    warranty          text                -- legacy free-form admin field (nullable)
);

-- ------- part_options -------
create table if not exists part_options (
    id             varchar primary key,
    device_id      varchar not null references devices(id) on delete cascade,
    repair_id      varchar not null references repairs(id),
    quality_key    varchar not null,
    quality_label  varchar not null,
    description    text not null default '',
    price_eur      double precision,
    on_request     boolean not null default false,
    warranty_days  integer not null default 365,
    warranty_label varchar not null default '12 maanden garantie',
    enabled        boolean not null default true,
    "order"        integer not null default 1
);
create index if not exists ix_part_options_device_id on part_options (device_id);
create index if not exists ix_part_options_repair_id on part_options (repair_id);

-- ------- warranties (per-repair catalog) -------
create table if not exists warranties (
    id             varchar primary key,
    repair_id      varchar not null references repairs(id),
    quality_key    varchar not null default 'standard',
    label          varchar not null,
    warranty_days  integer not null,
    warranty_label varchar not null,
    covers         jsonb not null default '[]',
    excludes       jsonb not null default '[]',
    "order"        integer not null default 1,
    enabled        boolean not null default true
);
create index if not exists ix_warranties_repair_id on warranties (repair_id);

-- ------- repair_methods -------
create table if not exists repair_methods (
    id                   varchar primary key,
    slug                 varchar not null,
    title                varchar not null,
    description          text not null default '',
    icon                 varchar not null default '',
    estimated_turnaround varchar not null default '',
    additional_price     double precision not null default 0,
    info                 text not null default '',
    enabled              boolean not null default true,
    "order"              integer not null default 0
);

-- ------- workshop (singleton row) -------
create table if not exists workshop (
    id                            varchar primary key default 'workshop-default',
    business_name                 varchar not null,
    workshop_name                 varchar not null,
    address                       varchar not null,
    postal_code                   varchar not null,
    city                          varchar not null,
    country                       varchar not null,
    email                         varchar not null,
    phone                         varchar not null,
    latitude                      double precision,
    longitude                     double precision,
    google_maps_link              text not null default '',
    parking_instructions          text not null default '',
    doorbell_instructions         text not null default '',
    opening_hours                 jsonb not null default '{}',
    closed_days                   jsonb not null default '[]',
    max_bookings_per_day          integer not null default 20,
    appointment_interval_minutes  integer not null default 30,
    socials                       jsonb not null default '{}'
);

-- ------- reviews -------
create table if not exists reviews (
    id          varchar primary key default gen_random_uuid()::text,
    author_name varchar not null default '',
    rating      integer not null,
    text        text not null default '',
    date        varchar not null,
    source      varchar
);

-- ------- faqs -------
create table if not exists faqs (
    id       varchar primary key default gen_random_uuid()::text,
    question text not null,
    answer   text not null,
    "order"  integer not null default 99
);

-- ------- settings (generic key/value store) -------
create table if not exists settings (
    key   varchar primary key,
    value text not null default ''
);

-- ------- email_settings (singleton row; id is internal only, never returned by the API) -------
create table if not exists email_settings (
    id            integer primary key default 1,
    smtp_host     varchar not null,
    smtp_port     integer not null,
    smtp_username varchar not null default '',
    smtp_password text not null default '',
    sender_name   varchar not null default 'Refixion',
    sender_email  varchar not null default '',
    reply_to      varchar,
    use_tls       boolean not null default true
);

-- ------- site_content (singleton row; one JSONB column per top-level section) -------
create table if not exists site_content (
    id              varchar primary key default 'site-content-default',
    hero            jsonb not null default '{}',
    trust           jsonb not null default '{}',
    how_it_works    jsonb not null default '{}',
    brands_section  jsonb not null default '{}',
    why             jsonb not null default '{}',
    reviews_section jsonb not null default '{}',
    faq_section     jsonb not null default '{}',
    cta             jsonb not null default '{}',
    footer          jsonb not null default '{}'
);

-- ------- seo (path is the natural key — no separate id, matching the original documents) -------
create table if not exists seo (
    path            varchar primary key,
    title           varchar not null default '',
    description     text not null default '',
    og_title        varchar not null default '',
    og_description  text not null default '',
    og_image        text not null default ''
);

-- ------- price_overrides (legacy/inert table — kept for parity; see MIGRATION_NOTES.md) -------
create table if not exists price_overrides (
    device_id varchar not null,
    repair_id varchar not null,
    price_eur double precision not null,
    primary key (device_id, repair_id)
);

-- ------- bookings -------
create table if not exists bookings (
    id                  uuid primary key default gen_random_uuid(),
    reference           varchar not null,

    brand_id            varchar not null,
    brand_name          varchar not null,
    device_id           varchar not null,
    device_name         varchar not null,
    repair_id           varchar not null,
    repair_name         varchar not null,

    part_option_id      varchar,
    part_quality_key    varchar,
    part_quality_label  varchar,
    warranty_days       integer,
    warranty_label      varchar,

    method_id           varchar not null,
    method_title        varchar not null,

    appointment_date    varchar not null,
    appointment_time    varchar not null,

    first_name          varchar not null,
    last_name           varchar not null,
    email               varchar not null,
    phone               varchar not null,
    street              varchar not null,
    house_number        varchar not null,
    postal_code         varchar not null,
    city                varchar not null,
    notes               text not null default '',

    duration_minutes    integer not null default 60,
    price_eur           double precision not null default 0,
    on_request          boolean not null default false,
    additional_price    double precision not null default 0,
    total_price         double precision not null default 0,

    status              varchar not null default 'pending',
    created_at          varchar not null,
    updated_at          varchar,

    ip                  varchar not null default '',
    user_agent          text not null default ''
);
create index if not exists ix_bookings_reference on bookings (reference);
create index if not exists ix_bookings_status on bookings (status);
create index if not exists ix_bookings_appointment_date on bookings (appointment_date);
create index if not exists ix_bookings_created_at on bookings (created_at);
create index if not exists ix_bookings_date_status on bookings (appointment_date, status);
