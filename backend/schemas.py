"""Pydantic request models — unchanged from the Mongo-based server.py.

These were never Mongo-specific (they validate incoming JSON bodies only), so they're
moved here verbatim for organization, with identical field names/types/defaults. No
request or response body changes.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


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
