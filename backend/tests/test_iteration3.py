"""Refixion Iteration 3 backend tests — brands (2), devices, part_options, warranties, bookings."""
import os
import pytest
import requests
from datetime import date, timedelta

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://premium-service-19.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@refixion.nl"
ADMIN_PASSWORD = "Refixion2026!"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_headers(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}", "Content-Type": "application/json"}


def next_weekday(offset=2):
    d = date.today() + timedelta(days=offset)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d.isoformat()


def _booking_payload(**over):
    p = {
        "brand_id": "brand-apple", "device_id": "dev-ip15p",
        "repair_id": "rep-screen", "method_id": "method-workshop",
        "appointment_date": next_weekday(), "appointment_time": "10:00",
        "first_name": "TEST", "last_name": "It3", "email": "t3@example.com",
        "phone": "+31612345678", "street": "S", "house_number": "1",
        "postal_code": "1000 AA", "city": "Amsterdam", "consent": True,
    }
    p.update(over)
    return p


# ---------- Brands / Devices ----------
class TestBrandsDevices:
    def test_brands_only_apple_samsung(self, s):
        r = s.get(f"{API}/brands")
        assert r.status_code == 200
        brands = r.json()
        slugs = sorted([b["slug"] for b in brands])
        assert slugs == ["apple", "samsung"], f"Expected only apple+samsung, got {slugs}"
        assert len(brands) == 2

    def test_apple_devices_33(self, s):
        r = s.get(f"{API}/devices", params={"brand_id": "brand-apple"})
        assert r.status_code == 200
        devs = r.json()
        assert len(devs) == 33, f"expected 33 got {len(devs)}"
        assert any(d["id"] == "dev-ip15p" for d in devs)
        assert any(d["id"] == "dev-ip16pm" for d in devs)

    def test_samsung_devices_25(self, s):
        r = s.get(f"{API}/devices", params={"brand_id": "brand-samsung"})
        assert r.status_code == 200
        devs = r.json()
        assert len(devs) == 25, f"expected 25 samsung phones per iter-3 spec, got {len(devs)}"


# ---------- Repairs / part_options ----------
class TestRepairsPartOptions:
    def test_repairs_ip15p_count_and_screen_options(self, s):
        r = s.get(f"{API}/repairs", params={"device_id": "dev-ip15p"})
        assert r.status_code == 200
        reps = r.json()
        assert len(reps) == 15
        screen = next(x for x in reps if x["id"] == "rep-screen")
        assert "part_options" in screen
        pos = screen["part_options"]
        assert len(pos) == 3
        keys = sorted([p["quality_key"] for p in pos])
        assert keys == ["high_quality", "original", "working"]
        # from_price = min price
        prices = [p["price_eur"] for p in pos]
        assert screen.get("from_price") == min(prices) == 50

    def test_repairs_ip15p_speaker_on_request(self, s):
        reps = s.get(f"{API}/repairs", params={"device_id": "dev-ip15p"}).json()
        spk = next(x for x in reps if x["id"] == "rep-speaker")
        assert len(spk["part_options"]) == 1
        assert spk["part_options"][0]["on_request"] is True
        assert spk["part_options"][0]["price_eur"] is None

    def test_part_options_endpoint(self, s):
        r = s.get(f"{API}/part-options", params={"device_id": "dev-ip15p", "repair_id": "rep-screen"})
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) == 3
        orders = [x["order"] for x in rows]
        assert orders == sorted(orders) == [1, 2, 3]


# ---------- Warranties public ----------
class TestWarrantiesPublic:
    def test_get_warranties(self, s):
        r = s.get(f"{API}/warranties")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("items"), list)
        assert len(d["items"]) >= 15
        assert isinstance(d.get("general_text"), str) and len(d["general_text"]) > 0


# ---------- Bookings with part_option_id ----------
class TestBookingsPartOption:
    def test_booking_screen_without_po_fails(self, s):
        r = s.post(f"{API}/bookings", json=_booking_payload())
        assert r.status_code == 400
        assert "Selecteer" in r.json().get("detail", "")

    def test_booking_screen_with_po_succeeds(self, s):
        p = _booking_payload(part_option_id="po-dev-ip15p-rep-screen-original")
        r = s.post(f"{API}/bookings", json=p)
        assert r.status_code == 200, r.text
        data = r.json()
        ref = data["reference"]
        # Fetch full booking
        got = s.get(f"{API}/bookings/{ref}").json()
        assert got["part_option_id"] == "po-dev-ip15p-rep-screen-original"
        assert got["part_quality_key"] == "original"
        assert "OEM" in got.get("part_quality_label", "") or "Origineel" in got.get("part_quality_label", "")
        assert got["warranty_days"] == 365
        assert "12" in got.get("warranty_label", "")
        assert float(got["price_eur"]) == 90.0

    def test_booking_battery_single_po_no_po_id(self, s):
        p = _booking_payload(repair_id="rep-battery", appointment_time="11:00")
        r = s.post(f"{API}/bookings", json=p)
        assert r.status_code == 200, r.text
        ref = r.json()["reference"]
        got = s.get(f"{API}/bookings/{ref}").json()
        assert got.get("part_option_id")  # auto-resolved

    def test_booking_speaker_on_request(self, s):
        p = _booking_payload(repair_id="rep-speaker", appointment_time="11:30")
        r = s.post(f"{API}/bookings", json=p)
        assert r.status_code == 200, r.text
        ref = r.json()["reference"]
        got = s.get(f"{API}/bookings/{ref}").json()
        assert got.get("on_request") is True
        assert float(got.get("price_eur", 0)) == 0.0


# ---------- Admin part-options ----------
class TestAdminPartOptions:
    def test_admin_part_options_requires_auth(self):
        r = requests.get(f"{API}/admin/part-options")
        assert r.status_code == 401

    def test_admin_update_price_and_restore(self, s, admin_headers):
        # baseline
        reps = s.get(f"{API}/repairs", params={"device_id": "dev-ip15p"}).json()
        screen = next(x for x in reps if x["id"] == "rep-screen")
        orig_from = screen["from_price"]
        po_id = "po-dev-ip15p-rep-screen-original"
        orig_po = next(p for p in screen["part_options"] if p["id"] == po_id)
        orig_price = orig_po["price_eur"]

        def _full(price, enabled=True):
            return {
                "device_id": orig_po["device_id"], "repair_id": orig_po["repair_id"],
                "quality_key": orig_po["quality_key"], "quality_label": orig_po["quality_label"],
                "description": orig_po.get("description", ""), "price_eur": price,
                "on_request": orig_po.get("on_request", False),
                "warranty_days": orig_po["warranty_days"], "warranty_label": orig_po["warranty_label"],
                "enabled": enabled, "order": orig_po["order"],
            }

        # bump to 999
        rr = s.put(f"{API}/admin/part-options/{po_id}", headers=admin_headers, json=_full(999))
        assert rr.status_code == 200, rr.text

        reps2 = s.get(f"{API}/repairs", params={"device_id": "dev-ip15p"}).json()
        screen2 = next(x for x in reps2 if x["id"] == "rep-screen")
        po2 = next(p for p in screen2["part_options"] if p["id"] == po_id)
        assert float(po2["price_eur"]) == 999.0

        # restore
        s.put(f"{API}/admin/part-options/{po_id}", headers=admin_headers, json=_full(orig_price))
        reps3 = s.get(f"{API}/repairs", params={"device_id": "dev-ip15p"}).json()
        screen3 = next(x for x in reps3 if x["id"] == "rep-screen")
        assert screen3["from_price"] == orig_from

    def test_admin_disable_part_option_and_restore(self, s, admin_headers):
        po_id = "po-dev-ip15p-rep-screen-high_quality"
        # fetch full row
        rows = s.get(f"{API}/admin/part-options",
                     params={"device_id": "dev-ip15p", "repair_id": "rep-screen"},
                     headers=admin_headers).json()
        orig = next(x for x in rows if x["id"] == po_id)

        def _full(enabled):
            return {k: orig[k] for k in ("device_id", "repair_id", "quality_key", "quality_label",
                                          "description", "price_eur", "on_request",
                                          "warranty_days", "warranty_label", "order")} | {"enabled": enabled}

        rr = s.put(f"{API}/admin/part-options/{po_id}", headers=admin_headers, json=_full(False))
        assert rr.status_code == 200

        pos = s.get(f"{API}/part-options",
                    params={"device_id": "dev-ip15p", "repair_id": "rep-screen"}).json()
        assert all(x["id"] != po_id for x in pos)

        reps = s.get(f"{API}/repairs", params={"device_id": "dev-ip15p"}).json()
        screen = next(x for x in reps if x["id"] == "rep-screen")
        assert all(p["id"] != po_id for p in screen["part_options"])
        assert len(screen["part_options"]) == 2

        # restore
        s.put(f"{API}/admin/part-options/{po_id}", headers=admin_headers, json=_full(True))
        pos2 = s.get(f"{API}/part-options",
                     params={"device_id": "dev-ip15p", "repair_id": "rep-screen"}).json()
        assert any(x["id"] == po_id for x in pos2)


# ---------- Admin warranties ----------
class TestAdminWarranties:
    def test_admin_warranties_crud(self, s, admin_headers):
        # create
        payload = {
            "repair_id": "rep-screen",
            "quality_key": "test_only",
            "label": "TEST warranty",
            "warranty_days": 90,
            "warranty_label": "90 dagen garantie",
            "covers": ["A", "B"],
            "excludes": ["C"],
            "order": 999,
        }
        r = s.post(f"{API}/admin/warranties", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        wid = r.json()["id"]

        # update — send full payload
        upd = dict(payload)
        upd["label"] = "TEST updated"
        upd["warranty_days"] = 120
        upd["warranty_label"] = "120 dagen garantie"
        rr = s.put(f"{API}/admin/warranties/{wid}", headers=admin_headers, json=upd)
        assert rr.status_code == 200

        pub = s.get(f"{API}/warranties").json()
        found = next((x for x in pub["items"] if x["id"] == wid), None)
        assert found is not None
        assert found["label"] == "TEST updated"
        assert found["warranty_days"] == 120

        # delete
        dr = s.delete(f"{API}/admin/warranties/{wid}", headers=admin_headers)
        assert dr.status_code == 200

        pub2 = s.get(f"{API}/warranties").json()
        assert not any(x["id"] == wid for x in pub2["items"])

    def test_admin_general_warranty_roundtrip(self, s, admin_headers):
        r = s.get(f"{API}/admin/general-warranty", headers=admin_headers)
        assert r.status_code == 200
        original = r.json().get("value", "") or r.json().get("general_text", "")
        # server may return either shape; handle both
        original_text = r.json().get("value") if "value" in r.json() else r.json().get("general_text", "")

        rr = s.put(f"{API}/admin/general-warranty", headers=admin_headers,
                   json={"value": "TEST general text"})
        assert rr.status_code == 200
        pub = s.get(f"{API}/warranties").json()
        assert pub["general_text"] == "TEST general text"

        # restore
        s.put(f"{API}/admin/general-warranty", headers=admin_headers,
              json={"value": original_text})
