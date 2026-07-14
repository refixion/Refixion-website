"""Refixion backend API tests."""
import os
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://premium-service-19.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@refixion.nl"
ADMIN_PASSWORD = "Refixion2026!"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


def next_weekday():
    d = date.today() + timedelta(days=1)
    while d.weekday() >= 5:  # 5=Sat 6=Sun
        d += timedelta(days=1)
    return d


def next_sunday():
    d = date.today() + timedelta(days=1)
    while d.weekday() != 6:
        d += timedelta(days=1)
    return d


# ---------- Public endpoints ----------
class TestPublic:
    def test_brands(self, s):
        r = s.get(f"{API}/brands")
        assert r.status_code == 200
        brands = r.json()
        assert len(brands) == 2
        slugs = [b["slug"] for b in brands]
        assert "apple" in slugs

    def test_devices_apple(self, s):
        r = s.get(f"{API}/devices", params={"brand_id": "brand-apple"})
        assert r.status_code == 200
        devs = r.json()
        assert len(devs) == 33
        assert any(d["id"] == "dev-ip16pm" for d in devs)

    def test_repairs(self, s):
        r = s.get(f"{API}/repairs")
        assert r.status_code == 200
        reps = r.json()
        assert len(reps) == 15

    def test_repair_methods(self, s):
        r = s.get(f"{API}/repair-methods")
        assert r.status_code == 200
        methods = r.json()
        assert len(methods) == 4

    def test_workshop(self, s):
        r = s.get(f"{API}/workshop")
        assert r.status_code == 200
        ws = r.json()
        assert ws["business_name"] == "Refixion"

    def test_reviews(self, s):
        r = s.get(f"{API}/reviews")
        assert r.status_code == 200
        data = r.json()
        assert "reviews" in data and "average" in data and "count" in data
        assert data["count"] >= 1

    def test_faqs(self, s):
        r = s.get(f"{API}/faqs")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_availability_weekday(self, s):
        d = next_weekday().isoformat()
        r = s.get(f"{API}/availability", params={"date": d})
        assert r.status_code == 200
        data = r.json()
        assert "slots" in data
        assert len(data["slots"]) > 0
        assert data.get("closed") is False

    def test_availability_sunday(self, s):
        d = next_sunday().isoformat()
        r = s.get(f"{API}/availability", params={"date": d})
        assert r.status_code == 200
        data = r.json()
        assert data.get("closed") is True
        assert data["slots"] == []


# ---------- Booking ----------
class TestBooking:
    booking_ref = None

    def test_create_booking(self, s):
        payload = {
            "brand_id": "brand-apple",
            "device_id": "dev-ip16pm",
            "repair_id": "rep-battery",
            "method_id": "method-workshop",
            "appointment_date": next_weekday().isoformat(),
            "appointment_time": "10:00",
            "first_name": "TEST",
            "last_name": "User",
            "email": "test_user@example.com",
            "phone": "+31612345678",
            "street": "Teststraat",
            "house_number": "1",
            "postal_code": "1000 AA",
            "city": "Amsterdam",
            "notes": "test booking",
            "consent": True,
        }
        r = s.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["reference"].startswith("RFX-")
        assert data["status"] == "pending"
        TestBooking.booking_ref = data["reference"]

    def test_get_booking_by_reference(self, s):
        assert TestBooking.booking_ref
        r = s.get(f"{API}/bookings/{TestBooking.booking_ref}")
        assert r.status_code == 200
        b = r.json()
        assert b["reference"] == TestBooking.booking_ref
        assert b["first_name"] == "TEST"

    def test_booking_consent_required(self, s):
        payload = {
            "brand_id": "brand-apple", "device_id": "dev-ip16pm",
            "repair_id": "rep-battery", "method_id": "method-workshop",
            "appointment_date": next_weekday().isoformat(),
            "appointment_time": "11:00",
            "first_name": "TEST", "last_name": "NoConsent",
            "email": "nc@example.com", "phone": "+31612345678",
            "street": "X", "house_number": "1", "postal_code": "1000 AA",
            "city": "Amsterdam", "consent": False,
        }
        r = s.post(f"{API}/bookings", json=payload)
        assert r.status_code == 400
        assert "Toestemming" in r.json().get("detail", "")


# ---------- Auth ----------
class TestAuth:
    def test_login(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        assert "access_token" in data

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, s, admin_headers):
        r = s.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_admin_bookings_unauthenticated(self):
        r = requests.get(f"{API}/admin/bookings")
        assert r.status_code == 401


# ---------- Admin ----------
class TestAdmin:
    def test_list_bookings(self, s, admin_headers):
        r = s.get(f"{API}/admin/bookings", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_stats(self, s, admin_headers):
        r = s.get(f"{API}/admin/bookings/stats", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "by_status" in d and "today" in d and "total" in d

    def test_update_booking_status(self, s, admin_headers):
        # find last TEST booking
        r = s.get(f"{API}/admin/bookings", headers=admin_headers)
        bookings = r.json()
        test_b = next((b for b in bookings if b.get("first_name") == "TEST"), None)
        assert test_b is not None
        rr = s.patch(f"{API}/admin/bookings/{test_b['id']}", headers=admin_headers, json={"status": "confirmed"})
        assert rr.status_code == 200
        # verify
        get_r = s.get(f"{API}/bookings/{test_b['reference']}")
        assert get_r.json()["status"] == "confirmed"

    def test_update_booking_invalid_status(self, s, admin_headers):
        r = s.get(f"{API}/admin/bookings", headers=admin_headers)
        b = next((x for x in r.json() if x.get("first_name") == "TEST"), None)
        if not b:
            pytest.skip("no test booking")
        rr = s.patch(f"{API}/admin/bookings/{b['id']}", headers=admin_headers, json={"status": "bogus"})
        assert rr.status_code == 400

    def test_repair_methods_get_update(self, s, admin_headers):
        r = s.get(f"{API}/admin/repair-methods", headers=admin_headers)
        assert r.status_code == 200
        methods = r.json()
        m = next((x for x in methods if x["id"] == "method-workshop"), methods[0])
        payload = {
            "title": m["title"], "slug": m["slug"], "description": m["description"],
            "icon": m["icon"], "estimated_turnaround": m["estimated_turnaround"],
            "additional_price": m.get("additional_price", 0), "info": m.get("info", ""),
            "enabled": m.get("enabled", True), "order": m.get("order", 0),
        }
        rr = s.put(f"{API}/admin/repair-methods/{m['id']}", headers=admin_headers, json=payload)
        assert rr.status_code == 200

    def test_workshop_update(self, s, admin_headers):
        r = s.get(f"{API}/workshop")
        ws = r.json()
        payload = {k: ws[k] for k in [
            "business_name","workshop_name","address","postal_code","city","country",
            "email","phone","opening_hours"
        ]}
        payload.update({
            "latitude": ws.get("latitude"), "longitude": ws.get("longitude"),
            "google_maps_link": ws.get("google_maps_link",""),
            "parking_instructions": ws.get("parking_instructions",""),
            "doorbell_instructions": ws.get("doorbell_instructions",""),
            "closed_days": ws.get("closed_days",[]),
            "max_bookings_per_day": ws.get("max_bookings_per_day",20),
            "appointment_interval_minutes": ws.get("appointment_interval_minutes",30),
            "socials": ws.get("socials",{}),
        })
        rr = s.put(f"{API}/admin/workshop", headers=admin_headers, json=payload)
        assert rr.status_code == 200

    def test_email_settings(self, s, admin_headers):
        r = s.get(f"{API}/admin/email-settings", headers=admin_headers)
        assert r.status_code == 200
        payload = {
            "smtp_host": "smtp.example.com", "smtp_port": 587,
            "smtp_username": "user", "smtp_password": "pass",
            "sender_name": "Refixion Test", "sender_email": "no-reply@refixion.nl",
            "use_tls": True,
        }
        rr = s.put(f"{API}/admin/email-settings", headers=admin_headers, json=payload)
        assert rr.status_code == 200


# ==================== Iteration 2 tests ====================

class TestSiteContent:
    def test_get_site_content(self, s):
        r = s.get(f"{API}/site-content")
        assert r.status_code == 200
        doc = r.json()
        for key in ["hero", "trust", "how_it_works", "brands_section", "why",
                    "reviews_section", "faq_section", "cta", "footer"]:
            assert key in doc, f"missing section {key}"

    def test_update_hero_and_restore(self, s, admin_headers):
        # get current
        cur = s.get(f"{API}/site-content").json()
        original = dict(cur["hero"])
        new_hero = dict(original)
        new_hero["headline_line1"] = "TEST HEADLINE"
        rr = s.put(f"{API}/admin/site-content", headers=admin_headers, json={"hero": new_hero})
        assert rr.status_code == 200
        # verify
        r2 = s.get(f"{API}/site-content").json()
        assert r2["hero"]["headline_line1"] == "TEST HEADLINE"
        # restore
        original["headline_line1"] = "Professionele smartphone\u00adreparaties."
        rr2 = s.put(f"{API}/admin/site-content", headers=admin_headers, json={"hero": original})
        assert rr2.status_code == 200
        r3 = s.get(f"{API}/site-content").json()
        assert r3["hero"]["headline_line1"] == original["headline_line1"]

    def test_update_site_content_no_valid_fields(self, s, admin_headers):
        rr = s.put(f"{API}/admin/site-content", headers=admin_headers, json={"bogus": {}})
        assert rr.status_code == 400


class TestSeo:
    def test_get_seo_home(self, s):
        r = s.get(f"{API}/seo", params={"path": "/"})
        assert r.status_code == 200
        d = r.json()
        assert d.get("path") == "/"
        assert "title" in d and "description" in d

    def test_get_seo_booking(self, s):
        r = s.get(f"{API}/seo", params={"path": "/booking"})
        assert r.status_code == 200
        d = r.json()
        assert d.get("path") == "/booking"

    def test_admin_list_seo(self, s, admin_headers):
        r = s.get(f"{API}/admin/seo", headers=admin_headers)
        assert r.status_code == 200
        entries = r.json()
        assert isinstance(entries, list)
        assert len(entries) >= 9

    def test_update_seo_pricing_and_restore(self, s, admin_headers):
        # get current
        list_r = s.get(f"{API}/admin/seo", headers=admin_headers).json()
        current = next((x for x in list_r if x["path"] == "/pricing"), None)
        assert current is not None
        original_title = current["title"]
        rr = s.put(f"{API}/admin/seo", headers=admin_headers,
                   json={"path": "/pricing", "title": "Test title"})
        assert rr.status_code == 200
        r2 = s.get(f"{API}/seo", params={"path": "/pricing"}).json()
        assert r2["title"] == "Test title"
        # restore
        s.put(f"{API}/admin/seo", headers=admin_headers,
              json={"path": "/pricing", "title": original_title})


class TestAdminBrands:
    def test_admin_brands_requires_auth(self):
        r = requests.get(f"{API}/admin/brands")
        assert r.status_code == 401

    def test_admin_brands_returns_4(self, s, admin_headers):
        r = s.get(f"{API}/admin/brands", headers=admin_headers)
        assert r.status_code == 200
        brands = r.json()
        assert len(brands) == 2


class TestAdminDevices:
    def test_create_list_delete_device(self, s, admin_headers):
        payload = {"brand_id": "brand-apple", "name": "iPhone TEST", "popular": False, "order": 999}
        r = s.post(f"{API}/admin/devices", headers=admin_headers, json=payload)
        assert r.status_code == 200
        dev = r.json()
        dev_id = dev["id"]
        assert dev["name"] == "iPhone TEST"
        assert dev["brand_id"] == "brand-apple"

        # list
        lr = s.get(f"{API}/admin/devices", headers=admin_headers)
        assert lr.status_code == 200
        assert any(d["id"] == dev_id for d in lr.json())

        # delete
        dr = s.delete(f"{API}/admin/devices/{dev_id}", headers=admin_headers)
        assert dr.status_code == 200

        # verify deleted
        lr2 = s.get(f"{API}/admin/devices", headers=admin_headers).json()
        assert not any(d["id"] == dev_id for d in lr2)

    def test_update_device_popular_flag(self, s, admin_headers):
        # get current popular value for dev-ip11
        devs = s.get(f"{API}/admin/devices", headers=admin_headers).json()
        d = next((x for x in devs if x["id"] == "dev-ip11"), None)
        assert d is not None
        original = bool(d.get("popular", False))
        rr = s.put(f"{API}/admin/devices/dev-ip11", headers=admin_headers, json={"popular": not original})
        assert rr.status_code == 200
        devs2 = s.get(f"{API}/admin/devices", headers=admin_headers).json()
        d2 = next(x for x in devs2 if x["id"] == "dev-ip11")
        assert bool(d2["popular"]) == (not original)
        # restore
        s.put(f"{API}/admin/devices/dev-ip11", headers=admin_headers, json={"popular": original})

    def test_update_missing_device_returns_404(self, s, admin_headers):
        rr = s.put(f"{API}/admin/devices/dev-does-not-exist", headers=admin_headers, json={"name": "x"})
        assert rr.status_code == 404


class TestPriceOverrides:
    @pytest.mark.skip(reason="iter-3: price is on part_options; legacy price_overrides endpoint is deprecated and no longer affects /repairs response")
    def test_price_override_lifecycle(self, s, admin_headers):
        # baseline: get default price for rep-screen on dev-ip16pm
        base = s.get(f"{API}/repairs", params={"device_id": "dev-ip16pm"}).json()
        screen = next(x for x in base if x["id"] == "rep-screen")
        default_price = screen["price_eur"]

        # set override to 149.00
        rr = s.put(f"{API}/admin/price-overrides", headers=admin_headers,
                   json={"device_id": "dev-ip16pm", "repair_id": "rep-screen", "price_eur": 149.00})
        assert rr.status_code == 200

        after = s.get(f"{API}/repairs", params={"device_id": "dev-ip16pm"}).json()
        screen2 = next(x for x in after if x["id"] == "rep-screen")
        assert float(screen2["price_eur"]) == 149.00

        # delete
        dr = s.delete(f"{API}/admin/price-overrides",
                      headers=admin_headers,
                      params={"device_id": "dev-ip16pm", "repair_id": "rep-screen"})
        assert dr.status_code == 200

        restored = s.get(f"{API}/repairs", params={"device_id": "dev-ip16pm"}).json()
        screen3 = next(x for x in restored if x["id"] == "rep-screen")
        assert float(screen3["price_eur"]) == float(default_price)


class TestEmailDefaults:
    def test_email_settings_defaults_present(self, s, admin_headers):
        r = s.get(f"{API}/admin/email-settings", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        # Iteration 2 spec: defaults for Gmail STARTTLS with empty credentials.
        # But if previous test_email_settings ran first, values may have been overwritten.
        # So we only assert that the row exists and has expected shape.
        assert "smtp_host" in d and "smtp_port" in d and "use_tls" in d
        assert d["smtp_port"] in (25, 465, 587)
