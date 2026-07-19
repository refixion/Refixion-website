"""Explicit ORM -> dict serializers.

Each function returns exactly the same set of keys the old Mongo documents had
(after their `{"_id": 0}` style projections). Explicit key lists are used everywhere
instead of a generic "dump all columns" helper, so that:

  1. internal-only columns (e.g. `email_settings.id`, `seo` has no id at all in the
     original schema) are never leaked into API responses, and
  2. fields that were only *sometimes* present in the Mongo documents (e.g. a booking's
     `updated_at`, which only exists after the first admin status change; a repair's
     legacy `price_eur`/`warranty`, only present if an admin ever set them) are included
     only when they have a value, matching "absent key" instead of "key: null".
"""
from models import (
    Booking,
    Brand,
    Device,
    EmailSettings,
    Faq,
    PartOption,
    Repair,
    RepairMethod,
    Review,
    Seo,
    SiteContent,
    User,
    Warranty,
    Workshop,
)


def brand_to_dict(b: Brand) -> dict:
    return {"id": b.id, "slug": b.slug, "name": b.name, "order": b.order, "enabled": b.enabled}


def device_to_dict(d: Device) -> dict:
    return {
        "id": d.id, "brand_id": d.brand_id, "name": d.name,
        "popular": d.popular, "order": d.order, "enabled": d.enabled,
    }


def repair_to_dict(r: Repair) -> dict:
    doc = {
        "id": r.id, "name": r.name, "description": r.description,
        "duration_minutes": r.duration_minutes, "icon": r.icon, "order": r.order,
        "has_quality_tiers": r.has_quality_tiers, "on_request": r.on_request, "enabled": r.enabled,
    }
    # Legacy free-form fields — only ever present once an admin has set them.
    if r.price_eur is not None:
        doc["price_eur"] = r.price_eur
    if r.warranty is not None:
        doc["warranty"] = r.warranty
    return doc


def part_option_to_dict(po: PartOption) -> dict:
    return {
        "id": po.id, "device_id": po.device_id, "repair_id": po.repair_id,
        "quality_key": po.quality_key, "quality_label": po.quality_label,
        "description": po.description, "price_eur": po.price_eur, "on_request": po.on_request,
        "warranty_days": po.warranty_days, "warranty_label": po.warranty_label,
        "enabled": po.enabled, "order": po.order,
    }


def warranty_to_dict(w: Warranty) -> dict:
    return {
        "id": w.id, "repair_id": w.repair_id, "quality_key": w.quality_key, "label": w.label,
        "warranty_days": w.warranty_days, "warranty_label": w.warranty_label,
        "covers": w.covers, "excludes": w.excludes, "order": w.order, "enabled": w.enabled,
    }


def repair_method_to_dict(m: RepairMethod) -> dict:
    return {
        "id": m.id, "slug": m.slug, "title": m.title, "description": m.description,
        "icon": m.icon, "estimated_turnaround": m.estimated_turnaround,
        "additional_price": m.additional_price, "info": m.info,
        "enabled": m.enabled, "order": m.order,
    }


def workshop_to_dict(w: Workshop) -> dict:
    return {
        "id": w.id, "business_name": w.business_name, "workshop_name": w.workshop_name,
        "address": w.address, "postal_code": w.postal_code, "city": w.city, "country": w.country,
        "email": w.email, "phone": w.phone, "latitude": w.latitude, "longitude": w.longitude,
        "google_maps_link": w.google_maps_link, "parking_instructions": w.parking_instructions,
        "doorbell_instructions": w.doorbell_instructions, "opening_hours": w.opening_hours,
        "closed_days": w.closed_days, "max_bookings_per_day": w.max_bookings_per_day,
        "appointment_interval_minutes": w.appointment_interval_minutes, "socials": w.socials,
    }


def review_to_dict(r: Review) -> dict:
    return {
        "id": r.id, "author_name": r.author_name, "rating": r.rating,
        "text": r.text, "date": r.date, "source": r.source,
    }


def faq_to_dict(f: Faq) -> dict:
    return {"id": f.id, "question": f.question, "answer": f.answer, "order": f.order}


def email_settings_to_dict(e: EmailSettings) -> dict:
    # No "id" key — the original Mongo document never had one either.
    return {
        "smtp_host": e.smtp_host, "smtp_port": e.smtp_port, "smtp_username": e.smtp_username,
        "smtp_password": e.smtp_password, "sender_name": e.sender_name, "sender_email": e.sender_email,
        "reply_to": e.reply_to, "use_tls": e.use_tls,
    }


def site_content_to_dict(sc: SiteContent) -> dict:
    doc = {"id": sc.id}
    for key in SiteContent.SECTION_KEYS:
        doc[key] = getattr(sc, key)
    return doc


def seo_to_dict(s: Seo) -> dict:
    # No "id" key — `path` is the natural key, exactly as in the original documents.
    return {
        "path": s.path, "title": s.title, "description": s.description,
        "og_title": s.og_title, "og_description": s.og_description, "og_image": s.og_image,
    }


def price_override_to_dict(p) -> dict:
    return {"device_id": p.device_id, "repair_id": p.repair_id, "price_eur": p.price_eur}


def user_public_dict(u: User) -> dict:
    """Matches `find_one(..., {"_id": 0, "password_hash": 0})` used by get_current_admin/me."""
    return {"id": u.id, "email": u.email, "name": u.name, "role": u.role, "created_at": u.created_at}


def user_login_dict(u: User) -> dict:
    """Matches the explicit subset literal built in the original login() handler."""
    return {"id": u.id, "email": u.email, "name": u.name, "role": u.role}


def booking_to_dict(b: Booking, *, public: bool = False) -> dict:
    doc = {
        "id": b.id, "reference": b.reference,
        "brand_id": b.brand_id, "brand_name": b.brand_name,
        "device_id": b.device_id, "device_name": b.device_name,
        "repair_id": b.repair_id, "repair_name": b.repair_name,
        "part_option_id": b.part_option_id, "part_quality_key": b.part_quality_key,
        "part_quality_label": b.part_quality_label, "warranty_days": b.warranty_days,
        "warranty_label": b.warranty_label, "method_id": b.method_id, "method_title": b.method_title,
        "appointment_date": b.appointment_date, "appointment_time": b.appointment_time,
        "first_name": b.first_name, "last_name": b.last_name, "email": b.email, "phone": b.phone,
        "street": b.street, "house_number": b.house_number, "postal_code": b.postal_code, "city": b.city,
        "notes": b.notes, "duration_minutes": b.duration_minutes, "price_eur": b.price_eur,
        "on_request": b.on_request, "additional_price": b.additional_price, "total_price": b.total_price,
        "status": b.status, "created_at": b.created_at,
    }
    if b.updated_at is not None:
        doc["updated_at"] = b.updated_at
    if not public:
        doc["ip"] = b.ip
        doc["user_agent"] = b.user_agent
    return doc
