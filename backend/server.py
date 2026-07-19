"""Refixion FastAPI backend — PostgreSQL (Supabase) version.

Migrated from MongoDB/Motor to SQLAlchemy (async) + asyncpg. Every endpoint keeps the
exact same path, request body, and response body as the original Mongo-backed version.
See MIGRATION_NOTES.md for a full rundown of the conversion decisions.
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging
import os
import secrets as _secrets
from datetime import date, datetime, time, timedelta
from email.message import EmailMessage
from typing import Any, Dict, List, Optional

import aiosmtplib
from fastapi import Depends, FastAPI, APIRouter, HTTPException, Query, Request, Response
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    ACCESS_TOKEN_MINUTES,
    create_access_token,
    get_current_admin,
    verify_password,
)
from database import AsyncSessionLocal, engine, get_session
from db_utils import upsert_set
from models import (
    Booking,
    Brand,
    Device,
    EmailSettings,
    Faq,
    PartOption,
    PriceOverride,
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
from schemas import (
    BookingIn,
    BookingStatusIn,
    EmailSettingsIn,
    LoginIn,
    PartOptionIn,
    RepairMethodIn,
    RepairPriceOverride,
    WarrantyIn,
    WorkshopIn,
)
from seed import seed_all
from serializers import (
    booking_to_dict,
    brand_to_dict,
    device_to_dict,
    email_settings_to_dict,
    faq_to_dict,
    part_option_to_dict,
    price_override_to_dict,
    repair_method_to_dict,
    repair_to_dict,
    review_to_dict,
    seo_to_dict,
    site_content_to_dict,
    user_login_dict,
    warranty_to_dict,
    workshop_to_dict,
)
from utils import new_id, now_iso

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("refixion")

app = FastAPI(title="Refixion API")
api = APIRouter(prefix="/api")


@app.on_event("startup")
async def on_startup():
    async with AsyncSessionLocal() as session:
        await seed_all(session)


@app.on_event("shutdown")
async def on_shutdown():
    await engine.dispose()


# ------- Public endpoints -------
@api.get("/")
async def root():
    return {"service": "refixion", "status": "ok"}


@api.get("/brands")
async def list_brands(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(
        select(Brand).where(Brand.enabled.is_(True)).order_by(Brand.order).limit(100)
    )).scalars().all()
    return [brand_to_dict(b) for b in rows]


@api.get("/devices")
async def list_devices(brand_id: Optional[str] = None, q: Optional[str] = None, session: AsyncSession = Depends(get_session)):
    stmt = select(Device).where(Device.enabled.is_(True))
    if brand_id:
        stmt = stmt.where(Device.brand_id == brand_id)
    if q:
        stmt = stmt.where(Device.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Device.order).limit(500)
    rows = (await session.execute(stmt)).scalars().all()
    return [device_to_dict(d) for d in rows]


@api.get("/repairs")
async def list_repairs(device_id: Optional[str] = None, session: AsyncSession = Depends(get_session)):
    """Return enabled repairs. If device_id is provided, attach enabled part_options
    (each with own price and warranty) plus a computed `from_price` for card display."""
    reps = (await session.execute(
        select(Repair).where(Repair.enabled.is_(True)).order_by(Repair.order).limit(200)
    )).scalars().all()
    rows = [repair_to_dict(r) for r in reps]
    if device_id:
        opts = (await session.execute(
            select(PartOption).where(PartOption.device_id == device_id, PartOption.enabled.is_(True)).limit(1000)
        )).scalars().all()
        by_repair: Dict[str, List[Dict[str, Any]]] = {}
        for o in opts:
            by_repair.setdefault(o.repair_id, []).append(part_option_to_dict(o))
        for r in rows:
            opts_list = sorted(by_repair.get(r["id"], []), key=lambda x: x.get("order", 99))
            r["part_options"] = opts_list
            prices = [o["price_eur"] for o in opts_list if o.get("price_eur") is not None]
            r["from_price"] = min(prices) if prices else None
            r["any_on_request"] = any(o.get("on_request") or o.get("price_eur") is None for o in opts_list) or not opts_list
    return rows


@api.get("/part-options")
async def list_part_options(device_id: str, repair_id: str, session: AsyncSession = Depends(get_session)):
    """Public — enabled part options only, for the booking wizard."""
    rows = (await session.execute(
        select(PartOption)
        .where(PartOption.device_id == device_id, PartOption.repair_id == repair_id, PartOption.enabled.is_(True))
        .order_by(PartOption.order)
        .limit(50)
    )).scalars().all()
    return [part_option_to_dict(o) for o in rows]


@api.get("/warranties")
async def list_warranties(session: AsyncSession = Depends(get_session)):
    """Public warranty catalog (per repair)."""
    rows = (await session.execute(
        select(Warranty).where(Warranty.enabled.is_(True)).order_by(Warranty.order).limit(200)
    )).scalars().all()
    text_row = await session.get(Setting, "general_warranty_text")
    return {"items": [warranty_to_dict(w) for w in rows], "general_text": text_row.value if text_row else ""}


@api.get("/repair-methods")
async def list_repair_methods(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(
        select(RepairMethod).where(RepairMethod.enabled.is_(True)).order_by(RepairMethod.order).limit(50)
    )).scalars().all()
    return [repair_method_to_dict(m) for m in rows]


@api.get("/workshop")
async def get_workshop(session: AsyncSession = Depends(get_session)):
    ws = await session.get(Workshop, "workshop-default")
    return workshop_to_dict(ws) if ws else None


@api.get("/reviews")
async def list_reviews(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Review).order_by(Review.date.desc()).limit(50))).scalars().all()
    reviews = [review_to_dict(r) for r in rows]
    avg = round(sum(r["rating"] for r in reviews) / max(len(reviews), 1), 2) if reviews else 0
    return {"reviews": reviews, "average": avg, "count": len(reviews)}


@api.get("/faqs")
async def list_faqs(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Faq).order_by(Faq.order).limit(100))).scalars().all()
    return [faq_to_dict(f) for f in rows]


@api.get("/availability")
async def get_availability(date_str: str = Query(..., alias="date"), session: AsyncSession = Depends(get_session)):
    """Return available time slots for a given date."""
    try:
        d = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ongeldige datum")
    ws_row = await session.get(Workshop, "workshop-default")
    if not ws_row:
        return {"slots": []}
    ws = workshop_to_dict(ws_row)
    weekday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][d.weekday()]
    day = ws["opening_hours"].get(weekday, {})
    if day.get("closed") or d.isoformat() in ws.get("closed_days", []):
        return {"slots": [], "closed": True}
    interval = int(ws.get("appointment_interval_minutes", 30))
    open_t = time.fromisoformat(day["open"])
    close_t = time.fromisoformat(day["close"])
    slots: List[str] = []
    current = datetime.combine(d, open_t)
    end = datetime.combine(d, close_t)
    # today: hide past slots
    now = datetime.now()
    while current + timedelta(minutes=interval) <= end:
        if d > now.date() or current.time() > (datetime.now() + timedelta(hours=1)).time():
            slots.append(current.strftime("%H:%M"))
        current += timedelta(minutes=interval)
    # subtract already-booked
    booked_times_rows = (await session.execute(
        select(Booking.appointment_time)
        .where(Booking.appointment_date == d.isoformat(), Booking.status.notin_(["cancelled"]))
        .limit(500)
    )).scalars().all()
    booked_times = set(booked_times_rows)
    max_per_day = int(ws.get("max_bookings_per_day", 20))
    if len(booked_times_rows) >= max_per_day:
        return {"slots": [], "full": True}
    available = [s for s in slots if s not in booked_times]
    return {"slots": available, "closed": False}


# ------- Booking -------
def _generate_reference() -> str:
    return "RFX-" + _secrets.token_hex(3).upper()


async def _load_booking_context(payload: BookingIn, session: AsyncSession):
    brand = await session.get(Brand, payload.brand_id)
    device = await session.get(Device, payload.device_id)
    repair = await session.get(Repair, payload.repair_id)
    method = await session.get(RepairMethod, payload.method_id)
    if not all([brand, device, repair, method]):
        raise HTTPException(status_code=400, detail="Ongeldige selectie")

    # Resolve part option — required. Client may either send an explicit part_option_id,
    # or (when repair has a single option) we can auto-resolve.
    if payload.part_option_id:
        option = await session.get(PartOption, payload.part_option_id)
        if option and not option.enabled:
            option = None
    else:
        opts = (await session.execute(
            select(PartOption)
            .where(PartOption.device_id == device.id, PartOption.repair_id == repair.id, PartOption.enabled.is_(True))
            .limit(10)
        )).scalars().all()
        if len(opts) != 1:
            raise HTTPException(status_code=400, detail="Selecteer een onderdeel-kwaliteit")
        option = opts[0]
    if not option:
        raise HTTPException(status_code=400, detail="Ongeldig onderdeel")

    price = float(option.price_eur) if option.price_eur is not None else 0.0
    on_request = bool(option.on_request or option.price_eur is None)
    total = price + float(method.additional_price)
    return brand, device, repair, method, option, price, on_request, total


def _customer_email_html(booking: dict, ws: dict) -> str:
    price_line = "Op aanvraag" if booking.get("on_request") else f"<strong>€{booking['total_price']:.2f}</strong>"
    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="background:#fff;border:1px solid #eaeaea;border-radius:16px;padding:40px;">
    <h1 style="font-size:24px;margin:0 0 8px;letter-spacing:-0.02em;">Bedankt voor uw boeking, {booking['first_name']}.</h1>
    <p style="color:#666;margin:0 0 32px;">We hebben uw reparatieverzoek ontvangen. Referentie <strong style="color:#111;">{booking['reference']}</strong>.</p>
    <div style="border-top:1px solid #eaeaea;padding-top:24px;">
      <table style="width:100%;font-size:14px;color:#111;border-collapse:collapse;">
        <tr><td style="color:#666;padding:8px 0;">Toestel</td><td style="text-align:right;">{booking['brand_name']} {booking['device_name']}</td></tr>
        <tr><td style="color:#666;padding:8px 0;">Reparatie</td><td style="text-align:right;">{booking['repair_name']}</td></tr>
        <tr><td style="color:#666;padding:8px 0;">Onderdeel</td><td style="text-align:right;">{booking.get('part_quality_label','Standaard')}</td></tr>
        <tr><td style="color:#666;padding:8px 0;">Garantie</td><td style="text-align:right;">{booking.get('warranty_label','')}</td></tr>
        <tr><td style="color:#666;padding:8px 0;">Methode</td><td style="text-align:right;">{booking['method_title']}</td></tr>
        <tr><td style="color:#666;padding:8px 0;">Datum</td><td style="text-align:right;">{booking['appointment_date']} · {booking['appointment_time']}</td></tr>
        <tr><td style="color:#666;padding:8px 0;">Geschatte prijs</td><td style="text-align:right;">{price_line}</td></tr>
      </table>
    </div>
    <p style="color:#666;margin-top:32px;font-size:14px;">Wij nemen contact met u op indien er wijzigingen zijn. Vragen? Reageer op deze e-mail of bel {ws.get('phone','')}.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eaeaea;color:#666;font-size:13px;">
      {ws.get('business_name','Refixion')} · {ws.get('address','')}, {ws.get('postal_code','')} {ws.get('city','')}
    </div>
  </div>
</div></body></html>"""


def _internal_email_html(booking: dict) -> str:
    return f"""<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;color:#111;">
<h2>Nieuwe reparatieboeking · {booking['reference']}</h2>
<table style="border-collapse:collapse;font-size:14px;">
<tr><td style="padding:4px 12px;color:#666;">Klant</td><td>{booking['first_name']} {booking['last_name']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Telefoon</td><td>{booking['phone']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">E-mail</td><td>{booking['email']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Adres</td><td>{booking['street']} {booking['house_number']}, {booking['postal_code']} {booking['city']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Merk / Toestel</td><td>{booking['brand_name']} · {booking['device_name']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Reparatie</td><td>{booking['repair_name']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Onderdeel</td><td>{booking.get('part_quality_label','Standaard')}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Garantie</td><td>{booking.get('warranty_label','')}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Methode</td><td>{booking['method_title']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Datum / Tijd</td><td>{booking['appointment_date']} · {booking['appointment_time']}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Duur</td><td>{booking['duration_minutes']} min</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Prijs</td><td>€{booking['total_price']:.2f}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Notities</td><td>{booking.get('notes','')}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">IP</td><td>{booking.get('ip','')}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Browser</td><td>{booking.get('user_agent','')}</td></tr>
</table></body></html>"""


async def _send_email(to_email: str, subject: str, html: str, session: AsyncSession) -> bool:
    settings_row = await session.get(EmailSettings, 1)
    if not settings_row:
        logger.warning("SMTP not configured; skipping email to %s", to_email)
        return False
    settings = email_settings_to_dict(settings_row)
    try:
        msg = EmailMessage()
        msg["From"] = f"{settings['sender_name']} <{settings['sender_email']}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        if settings.get("reply_to"):
            msg["Reply-To"] = settings["reply_to"]
        msg.set_content("HTML e-mail. Bekijk deze in een moderne mailclient.")
        msg.add_alternative(html, subtype="html")
        await aiosmtplib.send(
            msg,
            hostname=settings["smtp_host"],
            port=int(settings["smtp_port"]),
            username=settings["smtp_username"],
            password=settings["smtp_password"],
            start_tls=settings.get("use_tls", True),
        )
        return True
    except Exception as e:
        logger.exception("SMTP send failed: %s", e)
        return False


@api.post("/bookings")
async def create_booking(payload: BookingIn, request: Request, session: AsyncSession = Depends(get_session)):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Toestemming vereist")
    brand, device, repair, method, option, price, on_request, total = await _load_booking_context(payload, session)
    ws_row = await session.get(Workshop, "workshop-default")
    ws = workshop_to_dict(ws_row) if ws_row else {}

    ref = _generate_reference()
    booking = Booking(
        reference=ref,
        brand_id=brand.id, brand_name=brand.name,
        device_id=device.id, device_name=device.name,
        repair_id=repair.id, repair_name=repair.name,
        part_option_id=option.id,
        part_quality_key=option.quality_key,
        part_quality_label=option.quality_label,
        warranty_days=option.warranty_days,
        warranty_label=option.warranty_label,
        method_id=method.id, method_title=method.title,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        street=payload.street,
        house_number=payload.house_number,
        postal_code=payload.postal_code,
        city=payload.city,
        notes=payload.notes or "",
        duration_minutes=repair.duration_minutes if repair.duration_minutes is not None else 60,
        price_eur=price,
        on_request=on_request,
        additional_price=method.additional_price,
        total_price=total,
        status="pending",
        created_at=now_iso(),
        ip=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", ""),
    )
    session.add(booking)
    await session.commit()

    booking_dict = booking_to_dict(booking)

    # Send emails (fire and forget best-effort)
    internal_to = os.environ.get("INTERNAL_NOTIFICATION_EMAIL", "refixionstore@gmail.com")
    await _send_email(internal_to, f"Nieuwe reparatieboeking – {payload.first_name} {payload.last_name}", _internal_email_html(booking_dict), session)
    await _send_email(payload.email, "Uw Refixion reparatieboeking", _customer_email_html(booking_dict, ws), session)

    return {"reference": ref, "id": booking.id, "status": "pending", "total_price": total}


@api.get("/bookings/{reference}")
async def get_booking_public(reference: str, session: AsyncSession = Depends(get_session)):
    booking = (await session.execute(select(Booking).where(Booking.reference == reference).limit(1))).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Boeking niet gevonden")
    return booking_to_dict(booking, public=True)


# ------- Auth -------
@api.post("/auth/login")
async def login(payload: LoginIn, response: Response, session: AsyncSession = Depends(get_session)):
    email = payload.email.lower()
    user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Ongeldige inloggegevens")
    token = create_access_token(user.id, user.email)
    response.set_cookie(
        "access_token", token, httponly=True, secure=True, samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60, path="/",
    )
    return {"user": user_login_dict(user), "access_token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_admin)):
    return user


# ------- Admin -------
def admin_only(user: dict = Depends(get_current_admin)):
    return user


@api.get("/admin/bookings")
async def admin_list_bookings(
    status_f: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = None,
    _: dict = Depends(admin_only),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Booking)
    if status_f:
        stmt = stmt.where(Booking.status == status_f)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(
            Booking.reference.ilike(like),
            Booking.first_name.ilike(like),
            Booking.last_name.ilike(like),
            Booking.email.ilike(like),
        ))
    stmt = stmt.order_by(Booking.created_at.desc()).limit(1000)
    rows = (await session.execute(stmt)).scalars().all()
    return [booking_to_dict(b) for b in rows]


@api.get("/admin/bookings/stats")
async def admin_booking_stats(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    today = date.today().isoformat()
    group_rows = (await session.execute(
        select(Booking.status, func.count()).group_by(Booking.status).limit(20)
    )).all()
    by_status = {status: count for status, count in group_rows}
    today_count = (await session.execute(
        select(func.count()).select_from(Booking).where(Booking.appointment_date == today)
    )).scalar_one()
    total = (await session.execute(select(func.count()).select_from(Booking))).scalar_one()
    return {"by_status": by_status, "today": today_count, "total": total}


@api.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, payload: BookingStatusIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    valid = {"pending", "confirmed", "in_progress", "ready", "completed", "cancelled"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail="Ongeldige status")
    booking = await session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Boeking niet gevonden")
    booking.status = payload.status
    booking.updated_at = now_iso()
    await session.commit()
    return {"ok": True}


@api.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Booking).where(Booking.id == booking_id))
    await session.commit()
    return {"ok": True}


# repair methods
@api.get("/admin/repair-methods")
async def admin_list_methods(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(RepairMethod).order_by(RepairMethod.order).limit(100))).scalars().all()
    return [repair_method_to_dict(m) for m in rows]


@api.put("/admin/repair-methods/{method_id}")
async def admin_update_method(method_id: str, payload: RepairMethodIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    method = await session.get(RepairMethod, method_id)
    if not method:
        raise HTTPException(status_code=404, detail="Methode niet gevonden")
    for k, v in payload.model_dump().items():
        setattr(method, k, v)
    await session.commit()
    return {"ok": True}


@api.post("/admin/repair-methods")
async def admin_create_method(payload: RepairMethodIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    doc = {"id": f"method-{new_id()[:8]}", **payload.model_dump()}
    method = RepairMethod(**doc)
    session.add(method)
    await session.commit()
    return repair_method_to_dict(method)


# workshop
@api.put("/admin/workshop")
async def admin_update_workshop(payload: WorkshopIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    data = payload.model_dump()
    ws = await session.get(Workshop, "workshop-default")
    if ws:
        for k, v in data.items():
            setattr(ws, k, v)
    else:
        session.add(Workshop(id="workshop-default", **data))
    await session.commit()
    return {"ok": True}


# email settings
@api.get("/admin/email-settings")
async def admin_get_email_settings(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    s = await session.get(EmailSettings, 1)
    if not s:
        return {}
    d = email_settings_to_dict(s)
    # Original behavior preserved exactly: this always resolves to "" either way.
    d["smtp_password"] = "" if d.get("smtp_password") else ""
    return d


@api.put("/admin/email-settings")
async def admin_update_email_settings(payload: EmailSettingsIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    data = payload.model_dump()
    existing = await session.get(EmailSettings, 1)
    # if password blank, keep existing
    if not data.get("smtp_password") and existing:
        data["smtp_password"] = existing.smtp_password
    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
    else:
        session.add(EmailSettings(id=1, **data))
    await session.commit()
    return {"ok": True}


@api.post("/admin/email-settings/test")
async def admin_test_email(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    settings_row = await session.get(EmailSettings, 1)
    if not settings_row:
        raise HTTPException(status_code=400, detail="Geen e-mailinstellingen geconfigureerd")
    ok = await _send_email(
        settings_row.sender_email,
        "Refixion – Test e-mail",
        "<h2>Test succesvol</h2><p>Uw SMTP-configuratie werkt correct.</p>",
        session,
    )
    return {"ok": ok}


# repair CRUD (basic)
@api.get("/admin/repairs")
async def admin_list_repairs(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Repair).limit(500))).scalars().all()
    return [repair_to_dict(r) for r in rows]


@api.put("/admin/repairs/{repair_id}")
async def admin_update_repair(repair_id: str, payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    allowed = {"name", "description", "duration_minutes", "price_eur", "warranty", "icon", "enabled"}
    upd = {k: v for k, v in payload.items() if k in allowed}
    repair = await session.get(Repair, repair_id)
    if not repair:
        raise HTTPException(status_code=404, detail="Niet gevonden")
    for k, v in upd.items():
        setattr(repair, k, v)
    await session.commit()
    return {"ok": True}


# device CRUD
@api.get("/admin/devices")
async def admin_list_devices(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Device).limit(1000))).scalars().all()
    return [device_to_dict(d) for d in rows]


@api.post("/admin/devices")
async def admin_create_device(payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    device = Device(
        id=f"dev-{new_id()[:8]}",
        brand_id=payload["brand_id"],
        name=payload["name"],
        popular=bool(payload.get("popular", False)),
        order=int(payload.get("order", 99)),
        enabled=True,
    )
    session.add(device)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Ongeldig merk")
    return device_to_dict(device)


@api.put("/admin/devices/{device_id}")
async def admin_update_device(device_id: str, payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    allowed = {"name", "popular", "order", "enabled", "brand_id"}
    upd = {k: v for k, v in payload.items() if k in allowed}
    device = await session.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Niet gevonden")
    for k, v in upd.items():
        setattr(device, k, v)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Ongeldig merk")
    return {"ok": True}


@api.delete("/admin/devices/{device_id}")
async def admin_delete_device(device_id: str, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Device).where(Device.id == device_id))
    await session.commit()
    return {"ok": True}


# FAQs
@api.post("/admin/faqs")
async def admin_create_faq(payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    faq = Faq(id=new_id(), question=payload["question"], answer=payload["answer"], order=int(payload.get("order", 99)))
    session.add(faq)
    await session.commit()
    return faq_to_dict(faq)


@api.put("/admin/faqs/{faq_id}")
async def admin_update_faq(faq_id: str, payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    upd = {k: v for k, v in payload.items() if k in {"question", "answer", "order"}}
    faq = await session.get(Faq, faq_id)
    if faq:
        for k, v in upd.items():
            setattr(faq, k, v)
        await session.commit()
    # Original never checked matched_count here — always returns ok, even if missing.
    return {"ok": True}


@api.delete("/admin/faqs/{faq_id}")
async def admin_delete_faq(faq_id: str, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Faq).where(Faq.id == faq_id))
    await session.commit()
    return {"ok": True}


# ------- Admin: Part options -------
@api.get("/admin/part-options")
async def admin_list_part_options(
    device_id: Optional[str] = None,
    repair_id: Optional[str] = None,
    _: dict = Depends(admin_only),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(PartOption)
    if device_id:
        stmt = stmt.where(PartOption.device_id == device_id)
    if repair_id:
        stmt = stmt.where(PartOption.repair_id == repair_id)
    stmt = stmt.order_by(PartOption.order).limit(5000)
    rows = (await session.execute(stmt)).scalars().all()
    return [part_option_to_dict(o) for o in rows]


@api.post("/admin/part-options")
async def admin_create_part_option(payload: PartOptionIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    data = payload.model_dump()
    data["id"] = f"po-{data['device_id']}-{data['repair_id']}-{data['quality_key']}"
    existing = await session.get(PartOption, data["id"])
    if existing:
        raise HTTPException(status_code=400, detail="Deze optie bestaat al voor dit toestel/reparatie")
    po = PartOption(**data)
    session.add(po)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Ongeldig toestel of reparatie")
    return part_option_to_dict(po)


@api.put("/admin/part-options/{option_id}")
async def admin_update_part_option(option_id: str, payload: PartOptionIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    po = await session.get(PartOption, option_id)
    if not po:
        raise HTTPException(status_code=404, detail="Onderdeel-optie niet gevonden")
    for k, v in payload.model_dump().items():
        setattr(po, k, v)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Ongeldig toestel of reparatie")
    return {"ok": True}


@api.delete("/admin/part-options/{option_id}")
async def admin_delete_part_option(option_id: str, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(PartOption).where(PartOption.id == option_id))
    await session.commit()
    return {"ok": True}


# ------- Admin: Warranties (per-repair catalog) -------
@api.get("/admin/warranties")
async def admin_list_warranties(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(
        select(Warranty).order_by(Warranty.repair_id, Warranty.order).limit(500)
    )).scalars().all()
    return [warranty_to_dict(w) for w in rows]


@api.post("/admin/warranties")
async def admin_create_warranty(payload: WarrantyIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    data = payload.model_dump()
    data["id"] = f"war-{data['repair_id']}-{data['quality_key']}"
    await upsert_set(session, Warranty, data, index_elements=["id"])
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Ongeldige reparatie")
    return data


@api.put("/admin/warranties/{warranty_id}")
async def admin_update_warranty(warranty_id: str, payload: WarrantyIn, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    w = await session.get(Warranty, warranty_id)
    if not w:
        raise HTTPException(status_code=404, detail="Garantie niet gevonden")
    for k, v in payload.model_dump().items():
        setattr(w, k, v)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Ongeldige reparatie")
    return {"ok": True}


@api.delete("/admin/warranties/{warranty_id}")
async def admin_delete_warranty(warranty_id: str, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Warranty).where(Warranty.id == warranty_id))
    await session.commit()
    return {"ok": True}


@api.get("/admin/general-warranty")
async def admin_get_general_warranty(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    row = await session.get(Setting, "general_warranty_text")
    return {"value": row.value if row else ""}


@api.put("/admin/general-warranty")
async def admin_update_general_warranty(payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    val = str(payload.get("value", ""))
    await upsert_set(session, Setting, {"key": "general_warranty_text", "value": val}, index_elements=["key"])
    await session.commit()
    return {"ok": True}


# ------- Site Content (Homepage & Footer) -------
@api.get("/site-content")
async def get_site_content(session: AsyncSession = Depends(get_session)):
    doc = await session.get(SiteContent, "site-content-default")
    return site_content_to_dict(doc) if doc else {}


@api.put("/admin/site-content")
async def admin_update_site_content(payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    # Whitelist top-level sections
    allowed_sections = {"hero", "trust", "how_it_works", "brands_section", "why", "reviews_section", "faq_section", "cta", "footer"}
    updates = {k: v for k, v in payload.items() if k in allowed_sections}
    if not updates:
        raise HTTPException(status_code=400, detail="Geen geldige velden")
    doc = await session.get(SiteContent, "site-content-default")
    if not doc:
        doc = SiteContent(id="site-content-default")
        session.add(doc)
    for k, v in updates.items():
        setattr(doc, k, v)
    await session.commit()
    return {"ok": True}


# ------- SEO Metadata -------
@api.get("/seo")
async def get_seo(path: str = Query("/"), session: AsyncSession = Depends(get_session)):
    doc = await session.get(Seo, path)
    if not doc:
        # fall back to home
        doc = await session.get(Seo, "/")
    return seo_to_dict(doc) if doc else {}


@api.get("/admin/seo")
async def admin_list_seo(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Seo).limit(200))).scalars().all()
    return [seo_to_dict(s) for s in rows]


@api.put("/admin/seo")
async def admin_update_seo(payload: Dict[str, Any], _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    if "path" not in payload:
        raise HTTPException(status_code=400, detail="path is vereist")
    allowed = {"path", "title", "description", "og_title", "og_description", "og_image"}
    upd = {k: v for k, v in payload.items() if k in allowed}
    doc = await session.get(Seo, upd["path"])
    if doc:
        for k, v in upd.items():
            setattr(doc, k, v)
    else:
        session.add(Seo(**upd))
    await session.commit()
    return {"ok": True}


# ------- Price Overrides -------
@api.get("/admin/price-overrides")
async def admin_list_price_overrides(device_id: Optional[str] = None, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    stmt = select(PriceOverride)
    if device_id:
        stmt = stmt.where(PriceOverride.device_id == device_id)
    stmt = stmt.limit(2000)
    rows = (await session.execute(stmt)).scalars().all()
    return [price_override_to_dict(p) for p in rows]


@api.put("/admin/price-overrides")
async def admin_upsert_price_override(payload: RepairPriceOverride, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    data = payload.model_dump()
    await upsert_set(session, PriceOverride, data, index_elements=["device_id", "repair_id"])
    await session.commit()
    return {"ok": True}


@api.delete("/admin/price-overrides")
async def admin_delete_price_override(device_id: str, repair_id: str, _: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(PriceOverride).where(PriceOverride.device_id == device_id, PriceOverride.repair_id == repair_id))
    await session.commit()
    return {"ok": True}


# ------- Brands (admin list — useful for device UI) -------
@api.get("/admin/brands")
async def admin_list_brands(_: dict = Depends(admin_only), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Brand).order_by(Brand.order).limit(100))).scalars().all()
    return [brand_to_dict(b) for b in rows]


# ------- Mount -------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
