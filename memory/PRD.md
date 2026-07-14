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
- Configure real Gmail SMTP from admin panel to activate email dispatch (currently dormant — booking still saves).
- Homepage/content editor in admin (hero copy, hero image, buttons, footer text).
- SEO editor per page (title/description/OG per route).
- Per-device price overrides UI (endpoint exists — no admin UI yet).
- Multi-language (EN/DE/FR) with i18n plumbing.
- Device CRUD UI in admin (endpoints exist).

### P2 — later
- Customer accounts + repair tracking.
- Online payments (Stripe/Razorpay).
- SMS / WhatsApp notifications.
- Multi-workshop and multi-technician support.
- Invoices, inventory management, accessory webshop, refurbished-phone sales, discount codes, gift cards, referral, loyalty, live chat.

## Test Credentials
See `/app/memory/test_credentials.md`.
