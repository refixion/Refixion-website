# Refixion — Product Requirements Document

**Date started:** 2026-02-14
**Status:** MVP shipped (Iteration 1)

## Original Problem Statement
Build the official website for Refixion — a premium Dutch smartphone repair company. Should feel like a premium technology company (Apple.com × Linear.app × Stripe.com × Nothing.tech), not a typical repair shop. Includes public marketing site, 7-step booking wizard, and an admin panel for full business control without touching code.

## User Personas
- **End customer** (NL, cracked screen / dead battery): wants to book a repair quickly and know exactly what it costs, without creating an account.
- **Business customer** (SME/corporate): wants to arrange fleet repairs and invoicing.
- **Refixion Admin** (single user): manages bookings, prices, repair methods, workshop settings and SMTP without editing code.

## Core Requirements (locked in)
- Premium, Apple-inspired white/black aesthetic. No cheap gradients or repair-shop stock imagery.
- Language: Dutch (NL). Architecture supports future EN/DE/FR.
- Booking flow: 7 steps (Brand → Device → Repair → Method → Date/Time → Customer → Confirm) with progress bar, localStorage persistence, no account required, no online payment.
- Emails: internal notification to refixionstore@gmail.com + customer HTML confirmation, delivered via SMTP configurable in admin panel.
- Admin panel: JWT login, bookings management with status transitions & CSV export, repair-method CRUD, workshop settings, email-settings.

## Implemented (Iteration 2 — 2026-02-14)
- **Gmail SMTP defaults** pre-seeded (`smtp.gmail.com` : 587, STARTTLS on, empty credentials). Admin only pastes username + App Password when ready — no hard-coded secrets.
- **Admin → Toestellen & prijzen** (`/admin/devices`): brand tabs, inline device edit (name/order/popular/enabled), add device modal, per-device price-override modal that upserts on blur and restores default when cleared.
- **Admin → Website inhoud** (`/admin/content`): every homepage section editable via accordion form — hero (headline/subtitle/buttons/image/badge/floating cards), trust cards, how-it-works steps, why items, brands/reviews/FAQ/CTA/footer copy. Live-cached on the frontend and invalidated after save.
- **Admin → SEO** (`/admin/seo`): per-route title/description/OG title/OG description/OG image editor. Metadata applied dynamically to `<head>` on every route change via `useSeo()` hook.
- **i18n architecture**: `/app/frontend/src/i18n/` with `nl.js` translation bundle + `t()` helper + `setLocale()` / `subscribeLocale()`. Navbar & Footer wired through `t()` as reference. **No language switcher yet** — Dutch is the only active locale. Adding `en.js` / `de.js` / `fr.js` later requires no consumer changes.
- **Backend endpoints added**: GET `/api/site-content`, PUT `/api/admin/site-content`, GET `/api/seo`, GET/PUT `/api/admin/seo`, GET/PUT/DELETE `/api/admin/price-overrides`, GET `/api/admin/brands`.
- **Testing**: 37/37 backend tests pass (14 new + 23 iteration-1 regressions). All frontend flows verified end-to-end.

## Implemented (Iteration 1 — 2026-02-14)
- **Public site** (Home, Repairs, Pricing, Business, About, FAQ, Contact, Reviews, Legal ×3, 404) with Framer Motion, Lucide outline icons, Inter font, WCAG-safe contrast.
- **Homepage** sections: Hero + floating trust badges, animated Trust cards (CountUp), How It Works timeline, Brand cards (Apple/Samsung/Google/OnePlus via react-icons/si), Why Refixion grid, Reviews carousel, FAQ preview, black CTA.
- **7-step Booking Wizard** with localStorage persistence, dynamic device search, availability endpoint that honours workshop hours + booked-slot subtraction, Dutch validation.
- **Booking submission**: RFX-XXXXXX reference, MongoDB persistence, SMTP dispatch (graceful skip when unconfigured), success page with animated checkmark.
- **Admin Panel**: Login (JWT, cookies + Bearer), Dashboard (stats + recent bookings), Bookings table (search/filter/status/CSV export/delete), Repair Methods editor, Workshop editor (address + opening hours + intervals), Email SMTP settings + test-mail.
- **Seed data**: 4 brands, 34 devices, 11 repair types, 4 repair methods, 6 reviews, 8 FAQs, 1 workshop.
- **Testing**: 23/23 backend tests pass (`/app/backend/tests/backend_test.py`). Full E2E wizard flow verified.

## Backlog

### P1 — near-term
- Configure real Gmail SMTP from admin panel to activate email dispatch (currently dormant — booking still saves). Defaults are pre-filled.
- Add EN / DE / FR translation bundles (architecture ready — drop files into `/app/frontend/src/i18n/`) and enable language switcher in the navbar.
- Split `server.py` into `routers/{public,admin,content}.py` before further growth.
- Add Pydantic sub-models for `site_content` payload validation.
- CMS-style translation for FAQ / repair names (currently only static UI strings translatable — dynamic DB content stays in one language).

### P2 — later
- Customer accounts + repair tracking.
- Online payments (Stripe/Razorpay).
- SMS / WhatsApp notifications.
- Multi-workshop and multi-technician support.
- Invoices, inventory management, accessory webshop, refurbished-phone sales, discount codes, gift cards, referral, loyalty, live chat.

## Test Credentials
See `/app/memory/test_credentials.md`.
