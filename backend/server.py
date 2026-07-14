"""Refixion FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets as _secrets
from datetime import datetime, timezone, timedelta, date, time
from typing import List, Optional, Dict, Any

import bcrypt
import jwt
import aiosmtplib
from email.message import EmailMessage
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, Query, status
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from seed_data import (
    BRANDS, DEVICES, REPAIRS, REPAIR_METHODS, WORKSHOP, REVIEWS, FAQS,
    WARRANTIES, GENERAL_WARRANTY_TEXT, build_part_options,
)
from content_seed import SITE_CONTENT_DEFAULT, SEO_DEFAULTS

# ------- Config -------
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 8  # 8h for admin convenience

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("refixion")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Refixion API")
api = APIRouter(prefix="/api")


# ------- Helpers -------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Niet geauthenticeerd")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Ongeldig token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Geen admin-toegang")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token verlopen")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ongeldig token")


# ------- Models -------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class BookingIn(BaseModel):
    brand_id: str
    device_id: str
    repair_id: str
    part_option_id: Optional[str] = None  # required for repairs with multiple enabled part options
    method_id: str
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # HH:MM
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    street: str
    house_number: str
    postal_code: str
    city: str
    notes: Optional[str] = ""
    consent: bool


class PartOptionIn(BaseModel):
    device_id: str
    repair_id: str
    quality_key: str
    quality_label: str
    description: str = ""
    price_eur: Optional[float] = None
    on_request: bool = False
    warranty_days: int = 365
    warranty_label: str = "12 maanden garantie"
    enabled: bool = True
    order: int = 1


class WarrantyIn(BaseModel):
    repair_id: str
    quality_key: str = "standard"
    label: str
    warranty_days: int
    warranty_label: str
    covers: List[str] = []
    excludes: List[str] = []
    order: int = 1
    enabled: bool = True


class RepairMethodIn(BaseModel):
    title: str
    slug: str
    description: str
    icon: str
    estimated_turnaround: str
    additional_price: float = 0
    info: str = ""
    enabled: bool = True
    order: int = 0


class WorkshopIn(BaseModel):
    business_name: str
    workshop_name: str
    address: str
    postal_code: str
    city: str
    country: str
    email: str
    phone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_link: Optional[str] = ""
    parking_instructions: Optional[str] = ""
    doorbell_instructions: Optional[str] = ""
    opening_hours: Dict[str, Any]
    closed_days: List[str] = []
    max_bookings_per_day: int = 20
    appointment_interval_minutes: int = 30
    socials: Dict[str, str] = {}


class EmailSettingsIn(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    sender_name: str
    sender_email: EmailStr
    reply_to: Optional[EmailStr] = None
    use_tls: bool = True


class RepairPriceOverride(BaseModel):
    device_id: str
    repair_id: str
    price_eur: float


class BookingStatusIn(BaseModel):
    status: str  # pending | confirmed | in_progress | ready | completed | cancelled


# ------- Seeding -------
async def seed_all():
    # indexes
    await db.users.create_index("email", unique=True)
    await db.bookings.create_index("reference")

    # admin
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": new_id(),
            "email": admin_email,
            "password_hash": hash_password(admin_pw),
            "name": "Refixion Admin",
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info("Seeded admin user %s", admin_email)
    else:
        if not verify_password(admin_pw, existing["password_hash"]):
            await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

    # brands — remove deprecated (google/oneplus)
    await db.brands.delete_many({"id": {"$in": ["brand-google", "brand-oneplus"]}})
    for b in BRANDS:
        await db.brands.update_one({"id": b["id"]}, {"$set": b}, upsert=True)
    # devices — remove ones under deprecated brands + orphans no longer in the seed catalog
    await db.devices.delete_many({"brand_id": {"$in": ["brand-google", "brand-oneplus"]}})
    seed_device_ids = [d["id"] for d in DEVICES]
    await db.devices.delete_many({
        "brand_id": {"$in": ["brand-apple", "brand-samsung"]},
        "id": {"$nin": seed_device_ids},
    })
    for d in DEVICES:
        await db.devices.update_one(
            {"id": d["id"]},
            {"$set": {"brand_id": d["brand_id"], "name": d["name"], "popular": d["popular"], "order": d["order"]},
             "$setOnInsert": {"enabled": True}},
            upsert=True,
        )
    # repairs — upsert catalog (name/description/duration/icon/order from seed; enabled preserved)
    for r in REPAIRS:
        await db.repairs.update_one(
            {"id": r["id"]},
            {"$set": {k: r[k] for k in ("name", "description", "duration_minutes", "icon", "order", "has_quality_tiers", "on_request")},
             "$setOnInsert": {"enabled": True}},
            upsert=True,
        )
    # part options — seed only missing ones (never overwrite admin price edits)
    for po in build_part_options():
        await db.part_options.update_one(
            {"id": po["id"]},
            {"$setOnInsert": po},
            upsert=True,
        )
    # warranty catalog (per-repair covers/excludes)
    for w in WARRANTIES:
        await db.warranties.update_one({"id": w["id"]}, {"$setOnInsert": w}, upsert=True)
    # general warranty text
    await db.settings.update_one(
        {"key": "general_warranty_text"},
        {"$setOnInsert": {"key": "general_warranty_text", "value": GENERAL_WARRANTY_TEXT}},
        upsert=True,
    )
    # repair methods — remove deprecated methods (pickup, on-site), upsert the current set
    await db.repair_methods.delete_many({"id": {"$in": ["method-pickup", "method-onsite"]}})
    seed_method_ids = [m["id"] for m in REPAIR_METHODS]
    await db.repair_methods.delete_many({"id": {"$nin": seed_method_ids}})
    for m in REPAIR_METHODS:
        await db.repair_methods.update_one({"id": m["id"]}, {"$setOnInsert": m}, upsert=True)
    # workshop — force update to reflect current business details
    await db.workshop.update_one({"id": WORKSHOP["id"]}, {"$set": WORKSHOP}, upsert=True)
    # reviews — user opted-out of seeded reviews
    await db.reviews.delete_many({})
    for rv in REVIEWS:
        await db.reviews.update_one({"id": rv["id"]}, {"$setOnInsert": rv}, upsert=True)
    # faqs — force refresh (dedupe + updated copy)
    await db.faqs.delete_many({})
    for f in FAQS:
        await db.faqs.insert_one(dict(f))
    # site content
    await db.site_content.update_one({"id": SITE_CONTENT_DEFAULT["id"]}, {"$setOnInsert": SITE_CONTENT_DEFAULT}, upsert=True)
    # Force-update sections that changed per business request (rating line off, trust cards,
    # why items, footer socials, hero badge).
    await db.site_content.update_one({}, {"$set": {
        "hero.badge_text": SITE_CONTENT_DEFAULT["hero"]["badge_text"],
        "hero.rating_line_enabled": False,
        "trust.cards": SITE_CONTENT_DEFAULT["trust"]["cards"],
        "why.items": SITE_CONTENT_DEFAULT["why"]["items"],
        "footer": SITE_CONTENT_DEFAULT["footer"],
    }})
    # seo defaults — remove deprecated paths, upsert current set
    await db.seo.delete_many({"path": {"$in": ["/about", "/business", "/reviews"]}})
    for s in SEO_DEFAULTS:
        await db.seo.update_one({"path": s["path"]}, {"$setOnInsert": s}, upsert=True)
    # email settings — pre-fill defaults for Gmail (no credentials!) if not configured
    existing_email = await db.email_settings.find_one({})
    if not existing_email:
        await db.email_settings.insert_one({
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_username": "",
            "smtp_password": "",
            "sender_name": "Refixion",
            "sender_email": "",
            "reply_to": "",
            "use_tls": True,
        })


@app.on_event("startup")
async def on_startup():
    await seed_all()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ------- Public endpoints -------
@api.get("/")
async def root():
    return {"service": "refixion", "status": "ok"}


@api.get("/brands")
async def list_brands():
    rows = await db.brands.find({"enabled": True}, {"_id": 0}).sort("order", 1).to_list(100)
    return rows


@api.get("/devices")
async def list_devices(brand_id: Optional[str] = None, q: Optional[str] = None):
    query: Dict[str, Any] = {"enabled": {"$ne": False}}
    if brand_id:
        query["brand_id"] = brand_id
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    rows = await db.devices.find(query, {"_id": 0}).sort("order", 1).to_list(500)
    return rows


@api.get("/repairs")
async def list_repairs(device_id: Optional[str] = None):
    """Return enabled repairs. If device_id is provided, attach enabled part_options
    (each with own price and warranty) plus a computed `from_price` for card display."""
    rows = await db.repairs.find({"enabled": True}, {"_id": 0}).sort("order", 1).to_list(200)
    if device_id:
        options = await db.part_options.find({"device_id": device_id, "enabled": True}, {"_id": 0}).to_list(1000)
        by_repair: Dict[str, List[Dict[str, Any]]] = {}
        for o in options:
            by_repair.setdefault(o["repair_id"], []).append(o)
        for r in rows:
            opts = sorted(by_repair.get(r["id"], []), key=lambda x: x.get("order", 99))
            r["part_options"] = opts
            # from_price / any_on_request for display
            prices = [o["price_eur"] for o in opts if o.get("price_eur") is not None]
            r["from_price"] = min(prices) if prices else None
            r["any_on_request"] = any(o.get("on_request") or o.get("price_eur") is None for o in opts) or not opts
    return rows


@api.get("/part-options")
async def list_part_options(device_id: str, repair_id: str):
    """Public — enabled part options only, for the booking wizard."""
    rows = await db.part_options.find({"device_id": device_id, "repair_id": repair_id, "enabled": True}, {"_id": 0}).sort("order", 1).to_list(50)
    return rows


@api.get("/warranties")
async def list_warranties():
    """Public warranty catalog (per repair)."""
    rows = await db.warranties.find({"enabled": True}, {"_id": 0}).sort("order", 1).to_list(200)
    text_doc = await db.settings.find_one({"key": "general_warranty_text"}, {"_id": 0})
    return {"items": rows, "general_text": (text_doc or {}).get("value", "")}


@api.get("/repair-methods")
async def list_repair_methods():
    rows = await db.repair_methods.find({"enabled": True}, {"_id": 0}).sort("order", 1).to_list(50)
    return rows


@api.get("/workshop")
async def get_workshop():
    ws = await db.workshop.find_one({}, {"_id": 0})
    return ws


@api.get("/reviews")
async def list_reviews():
    rows = await db.reviews.find({}, {"_id": 0}).sort("date", -1).to_list(50)
    avg = round(sum(r["rating"] for r in rows) / max(len(rows), 1), 2) if rows else 0
    return {"reviews": rows, "average": avg, "count": len(rows)}


@api.get("/faqs")
async def list_faqs():
    return await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(100)


@api.get("/availability")
async def get_availability(date_str: str = Query(..., alias="date")):
    """Return available time slots for a given date."""
    try:
        d = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ongeldige datum")
    ws = await db.workshop.find_one({}, {"_id": 0})
    if not ws:
        return {"slots": []}
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
    booked = await db.bookings.find({"appointment_date": d.isoformat(), "status": {"$nin": ["cancelled"]}}, {"_id": 0, "appointment_time": 1}).to_list(500)
    booked_times = {b["appointment_time"] for b in booked}
    max_per_day = int(ws.get("max_bookings_per_day", 20))
    if len(booked) >= max_per_day:
        return {"slots": [], "full": True}
    available = [s for s in slots if s not in booked_times]
    return {"slots": available, "closed": False}


# ------- Booking -------
def _generate_reference() -> str:
    return "RFX-" + _secrets.token_hex(3).upper()


async def _load_booking_context(payload: BookingIn):
    brand = await db.brands.find_one({"id": payload.brand_id}, {"_id": 0})
    device = await db.devices.find_one({"id": payload.device_id}, {"_id": 0})
    repair = await db.repairs.find_one({"id": payload.repair_id}, {"_id": 0})
    method = await db.repair_methods.find_one({"id": payload.method_id}, {"_id": 0})
    if not all([brand, device, repair, method]):
        raise HTTPException(status_code=400, detail="Ongeldige selectie")

    # Resolve part option — required. Client may either send an explicit part_option_id,
    # or (when repair has a single option) we can auto-resolve.
    if payload.part_option_id:
        option = await db.part_options.find_one({"id": payload.part_option_id, "enabled": True}, {"_id": 0})
    else:
        opts = await db.part_options.find({"device_id": device["id"], "repair_id": repair["id"], "enabled": True}, {"_id": 0}).to_list(10)
        if len(opts) != 1:
            raise HTTPException(status_code=400, detail="Selecteer een onderdeel-kwaliteit")
        option = opts[0]
    if not option:
        raise HTTPException(status_code=400, detail="Ongeldig onderdeel")

    price = float(option["price_eur"]) if option.get("price_eur") is not None else 0.0
    on_request = option.get("on_request") or option.get("price_eur") is None
    total = price + float(method.get("additional_price", 0))
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


async def _send_email(to_email: str, subject: str, html: str) -> bool:
    settings = await db.email_settings.find_one({}, {"_id": 0})
    if not settings:
        logger.warning("SMTP not configured; skipping email to %s", to_email)
        return False
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
async def create_booking(payload: BookingIn, request: Request):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Toestemming vereist")
    brand, device, repair, method, option, price, on_request, total = await _load_booking_context(payload)
    ws = await db.workshop.find_one({}, {"_id": 0}) or {}

    ref = _generate_reference()
    booking = {
        "id": new_id(),
        "reference": ref,
        "brand_id": brand["id"], "brand_name": brand["name"],
        "device_id": device["id"], "device_name": device["name"],
        "repair_id": repair["id"], "repair_name": repair["name"],
        "part_option_id": option["id"],
        "part_quality_key": option["quality_key"],
        "part_quality_label": option["quality_label"],
        "warranty_days": option.get("warranty_days", 365),
        "warranty_label": option.get("warranty_label", ""),
        "method_id": method["id"], "method_title": method["title"],
        "appointment_date": payload.appointment_date,
        "appointment_time": payload.appointment_time,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "email": payload.email,
        "phone": payload.phone,
        "street": payload.street,
        "house_number": payload.house_number,
        "postal_code": payload.postal_code,
        "city": payload.city,
        "notes": payload.notes or "",
        "duration_minutes": repair.get("duration_minutes", 60),
        "price_eur": price,
        "on_request": on_request,
        "additional_price": method.get("additional_price", 0),
        "total_price": total,
        "status": "pending",
        "created_at": now_iso(),
        "ip": request.client.host if request.client else "",
        "user_agent": request.headers.get("user-agent", ""),
    }
    await db.bookings.insert_one(dict(booking))

    # Send emails (fire and forget best-effort)
    internal_to = os.environ.get("INTERNAL_NOTIFICATION_EMAIL", "refixionstore@gmail.com")
    await _send_email(internal_to, f"Nieuwe reparatieboeking – {payload.first_name} {payload.last_name}", _internal_email_html(booking))
    await _send_email(payload.email, "Uw Refixion reparatieboeking", _customer_email_html(booking, ws))

    return {"reference": ref, "id": booking["id"], "status": "pending", "total_price": total}


@api.get("/bookings/{reference}")
async def get_booking_public(reference: str):
    booking = await db.bookings.find_one({"reference": reference}, {"_id": 0, "ip": 0, "user_agent": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Boeking niet gevonden")
    return booking


# ------- Auth -------
@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Ongeldige inloggegevens")
    token = create_access_token(user["id"], user["email"])
    response.set_cookie(
        "access_token", token, httponly=True, secure=True, samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60, path="/",
    )
    return {
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
        "access_token": token,
    }


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
async def admin_list_bookings(status_f: Optional[str] = Query(None, alias="status"), q: Optional[str] = None, _: dict = Depends(admin_only)):
    query: Dict[str, Any] = {}
    if status_f:
        query["status"] = status_f
    if q:
        query["$or"] = [
            {"reference": {"$regex": q, "$options": "i"}},
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    rows = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return rows


@api.get("/admin/bookings/stats")
async def admin_booking_stats(_: dict = Depends(admin_only)):
    today = date.today().isoformat()
    pipeline = await db.bookings.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(20)
    by_status = {p["_id"]: p["count"] for p in pipeline}
    today_count = await db.bookings.count_documents({"appointment_date": today})
    total = await db.bookings.count_documents({})
    return {"by_status": by_status, "today": today_count, "total": total}


@api.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, payload: BookingStatusIn, _: dict = Depends(admin_only)):
    valid = {"pending", "confirmed", "in_progress", "ready", "completed", "cancelled"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail="Ongeldige status")
    result = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": payload.status, "updated_at": now_iso()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Boeking niet gevonden")
    return {"ok": True}


@api.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, _: dict = Depends(admin_only)):
    await db.bookings.delete_one({"id": booking_id})
    return {"ok": True}


# repair methods
@api.get("/admin/repair-methods")
async def admin_list_methods(_: dict = Depends(admin_only)):
    return await db.repair_methods.find({}, {"_id": 0}).sort("order", 1).to_list(100)


@api.put("/admin/repair-methods/{method_id}")
async def admin_update_method(method_id: str, payload: RepairMethodIn, _: dict = Depends(admin_only)):
    result = await db.repair_methods.update_one({"id": method_id}, {"$set": payload.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Methode niet gevonden")
    return {"ok": True}


@api.post("/admin/repair-methods")
async def admin_create_method(payload: RepairMethodIn, _: dict = Depends(admin_only)):
    doc = {"id": f"method-{new_id()[:8]}", **payload.model_dump()}
    await db.repair_methods.insert_one(dict(doc))
    return doc


# workshop
@api.put("/admin/workshop")
async def admin_update_workshop(payload: WorkshopIn, _: dict = Depends(admin_only)):
    await db.workshop.update_one({}, {"$set": payload.model_dump()}, upsert=True)
    return {"ok": True}


# email settings
@api.get("/admin/email-settings")
async def admin_get_email_settings(_: dict = Depends(admin_only)):
    s = await db.email_settings.find_one({}, {"_id": 0})
    if s:
        s["smtp_password"] = "" if s.get("smtp_password") else ""
    return s or {}


@api.put("/admin/email-settings")
async def admin_update_email_settings(payload: EmailSettingsIn, _: dict = Depends(admin_only)):
    data = payload.model_dump()
    existing = await db.email_settings.find_one({})
    # if password blank, keep existing
    if not data.get("smtp_password") and existing:
        data["smtp_password"] = existing.get("smtp_password", "")
    await db.email_settings.update_one({}, {"$set": data}, upsert=True)
    return {"ok": True}


@api.post("/admin/email-settings/test")
async def admin_test_email(_: dict = Depends(admin_only)):
    settings = await db.email_settings.find_one({}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="Geen e-mailinstellingen geconfigureerd")
    ok = await _send_email(
        settings["sender_email"],
        "Refixion – Test e-mail",
        "<h2>Test succesvol</h2><p>Uw SMTP-configuratie werkt correct.</p>",
    )
    return {"ok": ok}


# repair CRUD (basic)
@api.get("/admin/repairs")
async def admin_list_repairs(_: dict = Depends(admin_only)):
    return await db.repairs.find({}, {"_id": 0}).to_list(500)


@api.put("/admin/repairs/{repair_id}")
async def admin_update_repair(repair_id: str, payload: Dict[str, Any], _: dict = Depends(admin_only)):
    allowed = {"name", "description", "duration_minutes", "price_eur", "warranty", "icon", "enabled"}
    upd = {k: v for k, v in payload.items() if k in allowed}
    result = await db.repairs.update_one({"id": repair_id}, {"$set": upd})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Niet gevonden")
    return {"ok": True}


# device CRUD
@api.get("/admin/devices")
async def admin_list_devices(_: dict = Depends(admin_only)):
    return await db.devices.find({}, {"_id": 0}).to_list(1000)


@api.post("/admin/devices")
async def admin_create_device(payload: Dict[str, Any], _: dict = Depends(admin_only)):
    doc = {
        "id": f"dev-{new_id()[:8]}",
        "brand_id": payload["brand_id"],
        "name": payload["name"],
        "popular": bool(payload.get("popular", False)),
        "order": int(payload.get("order", 99)),
        "enabled": True,
    }
    await db.devices.insert_one(dict(doc))
    return doc


@api.put("/admin/devices/{device_id}")
async def admin_update_device(device_id: str, payload: Dict[str, Any], _: dict = Depends(admin_only)):
    allowed = {"name", "popular", "order", "enabled", "brand_id"}
    upd = {k: v for k, v in payload.items() if k in allowed}
    result = await db.devices.update_one({"id": device_id}, {"$set": upd})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Niet gevonden")
    return {"ok": True}


@api.delete("/admin/devices/{device_id}")
async def admin_delete_device(device_id: str, _: dict = Depends(admin_only)):
    await db.devices.delete_one({"id": device_id})
    return {"ok": True}


# FAQs
@api.post("/admin/faqs")
async def admin_create_faq(payload: Dict[str, Any], _: dict = Depends(admin_only)):
    doc = {"id": new_id(), "question": payload["question"], "answer": payload["answer"], "order": int(payload.get("order", 99))}
    await db.faqs.insert_one(dict(doc))
    return doc


@api.put("/admin/faqs/{faq_id}")
async def admin_update_faq(faq_id: str, payload: Dict[str, Any], _: dict = Depends(admin_only)):
    upd = {k: v for k, v in payload.items() if k in {"question", "answer", "order"}}
    await db.faqs.update_one({"id": faq_id}, {"$set": upd})
    return {"ok": True}


@api.delete("/admin/faqs/{faq_id}")
async def admin_delete_faq(faq_id: str, _: dict = Depends(admin_only)):
    await db.faqs.delete_one({"id": faq_id})
    return {"ok": True}


# ------- Admin: Part options -------
@api.get("/admin/part-options")
async def admin_list_part_options(device_id: Optional[str] = None, repair_id: Optional[str] = None, _: dict = Depends(admin_only)):
    query: Dict[str, Any] = {}
    if device_id:
        query["device_id"] = device_id
    if repair_id:
        query["repair_id"] = repair_id
    return await db.part_options.find(query, {"_id": 0}).sort("order", 1).to_list(5000)


@api.post("/admin/part-options")
async def admin_create_part_option(payload: PartOptionIn, _: dict = Depends(admin_only)):
    data = payload.model_dump()
    data["id"] = f"po-{data['device_id']}-{data['repair_id']}-{data['quality_key']}"
    existing = await db.part_options.find_one({"id": data["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Deze optie bestaat al voor dit toestel/reparatie")
    await db.part_options.insert_one(dict(data))
    return data


@api.put("/admin/part-options/{option_id}")
async def admin_update_part_option(option_id: str, payload: PartOptionIn, _: dict = Depends(admin_only)):
    result = await db.part_options.update_one({"id": option_id}, {"$set": payload.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Onderdeel-optie niet gevonden")
    return {"ok": True}


@api.delete("/admin/part-options/{option_id}")
async def admin_delete_part_option(option_id: str, _: dict = Depends(admin_only)):
    await db.part_options.delete_one({"id": option_id})
    return {"ok": True}


# ------- Admin: Warranties (per-repair catalog) -------
@api.get("/admin/warranties")
async def admin_list_warranties(_: dict = Depends(admin_only)):
    return await db.warranties.find({}, {"_id": 0}).sort([("repair_id", 1), ("order", 1)]).to_list(500)


@api.post("/admin/warranties")
async def admin_create_warranty(payload: WarrantyIn, _: dict = Depends(admin_only)):
    data = payload.model_dump()
    data["id"] = f"war-{data['repair_id']}-{data['quality_key']}"
    await db.warranties.update_one({"id": data["id"]}, {"$set": data}, upsert=True)
    return data


@api.put("/admin/warranties/{warranty_id}")
async def admin_update_warranty(warranty_id: str, payload: WarrantyIn, _: dict = Depends(admin_only)):
    result = await db.warranties.update_one({"id": warranty_id}, {"$set": payload.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Garantie niet gevonden")
    return {"ok": True}


@api.delete("/admin/warranties/{warranty_id}")
async def admin_delete_warranty(warranty_id: str, _: dict = Depends(admin_only)):
    await db.warranties.delete_one({"id": warranty_id})
    return {"ok": True}


@api.get("/admin/general-warranty")
async def admin_get_general_warranty(_: dict = Depends(admin_only)):
    doc = await db.settings.find_one({"key": "general_warranty_text"}, {"_id": 0})
    return {"value": (doc or {}).get("value", "")}


@api.put("/admin/general-warranty")
async def admin_update_general_warranty(payload: Dict[str, Any], _: dict = Depends(admin_only)):
    val = str(payload.get("value", ""))
    await db.settings.update_one({"key": "general_warranty_text"}, {"$set": {"value": val}}, upsert=True)
    return {"ok": True}


# ------- Site Content (Homepage & Footer) -------
@api.get("/site-content")
async def get_site_content():
    doc = await db.site_content.find_one({}, {"_id": 0})
    return doc or {}


@api.put("/admin/site-content")
async def admin_update_site_content(payload: Dict[str, Any], _: dict = Depends(admin_only)):
    # Whitelist top-level sections
    allowed_sections = {"hero", "trust", "how_it_works", "brands_section", "why", "reviews_section", "faq_section", "cta", "footer"}
    updates = {k: v for k, v in payload.items() if k in allowed_sections}
    if not updates:
        raise HTTPException(status_code=400, detail="Geen geldige velden")
    await db.site_content.update_one({}, {"$set": updates}, upsert=True)
    return {"ok": True}


# ------- SEO Metadata -------
@api.get("/seo")
async def get_seo(path: str = Query("/")):
    doc = await db.seo.find_one({"path": path}, {"_id": 0})
    if not doc:
        # fall back to home
        doc = await db.seo.find_one({"path": "/"}, {"_id": 0})
    return doc or {}


@api.get("/admin/seo")
async def admin_list_seo(_: dict = Depends(admin_only)):
    return await db.seo.find({}, {"_id": 0}).to_list(200)


@api.put("/admin/seo")
async def admin_update_seo(payload: Dict[str, Any], _: dict = Depends(admin_only)):
    if "path" not in payload:
        raise HTTPException(status_code=400, detail="path is vereist")
    allowed = {"path", "title", "description", "og_title", "og_description", "og_image"}
    upd = {k: v for k, v in payload.items() if k in allowed}
    await db.seo.update_one({"path": upd["path"]}, {"$set": upd}, upsert=True)
    return {"ok": True}


# ------- Price Overrides -------
@api.get("/admin/price-overrides")
async def admin_list_price_overrides(device_id: Optional[str] = None, _: dict = Depends(admin_only)):
    query = {}
    if device_id:
        query["device_id"] = device_id
    return await db.price_overrides.find(query, {"_id": 0}).to_list(2000)


@api.put("/admin/price-overrides")
async def admin_upsert_price_override(payload: RepairPriceOverride, _: dict = Depends(admin_only)):
    data = payload.model_dump()
    await db.price_overrides.update_one(
        {"device_id": data["device_id"], "repair_id": data["repair_id"]},
        {"$set": data},
        upsert=True,
    )
    return {"ok": True}


@api.delete("/admin/price-overrides")
async def admin_delete_price_override(device_id: str, repair_id: str, _: dict = Depends(admin_only)):
    await db.price_overrides.delete_one({"device_id": device_id, "repair_id": repair_id})
    return {"ok": True}


# ------- Brands (admin list — useful for device UI) -------
@api.get("/admin/brands")
async def admin_list_brands(_: dict = Depends(admin_only)):
    return await db.brands.find({}, {"_id": 0}).sort("order", 1).to_list(100)


# ------- Mount -------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
