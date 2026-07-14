"""Refixion Iteration 4 backend tests — content/scope changes.
- Workshop address/contact/socials
- Only workshop + mail-in methods
- No reviews
- 8 deduped FAQs incl. mail-in
- Site content trust/why/footer updates
- SEO deprecated paths gone
- Bookings pickup/onsite rejected; mail-in ok
"""
import os
from datetime import date, timedelta
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://premium-service-19.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def _next_weekday(offset=2):
    d = date.today() + timedelta(days=offset)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d.isoformat()


# Workshop
class TestWorkshop:
    def test_workshop_new_address_and_socials(self, s):
        r = s.get(f"{API}/workshop")
        assert r.status_code == 200
        ws = r.json()
        assert ws["address"] == "Dorpsstraat 51"
        assert ws["postal_code"] == "1721 BB"
        assert ws["city"] == "Broek op Langedijk"
        assert ws["email"] == "refixionstore@gmail.com"
        assert ws["phone"] == "+31 6 44859536"
        soc = ws.get("socials", {})
        assert soc.get("instagram") == "https://www.instagram.com/refixionnl"
        assert soc.get("tiktok") == "https://www.tiktok.com/@refixionstore"
        assert "facebook" not in soc or not soc.get("facebook")

    def test_opening_hours(self, s):
        oh = s.get(f"{API}/workshop").json()["opening_hours"]
        assert oh["monday"]["open"] == "09:00" and oh["monday"]["close"] == "18:00"
        assert oh["thursday"]["close"] == "20:00"
        assert oh["saturday"]["open"] == "10:00" and oh["saturday"]["close"] == "17:00"
        assert oh["sunday"]["closed"] is True


# Repair methods
class TestRepairMethods:
    def test_only_workshop_and_mailin(self, s):
        r = s.get(f"{API}/repair-methods")
        assert r.status_code == 200
        methods = r.json()
        slugs = sorted([m["slug"] for m in methods])
        assert slugs == ["mail-in", "workshop"], f"got {slugs}"
        assert len(methods) == 2
        ids = [m["id"] for m in methods]
        assert "method-pickup" not in ids
        assert "method-onsite" not in ids


# Reviews
class TestReviews:
    def test_reviews_empty(self, s):
        r = s.get(f"{API}/reviews")
        assert r.status_code == 200
        d = r.json()
        assert d["count"] == 0
        assert d["reviews"] == []


# FAQs
class TestFaqs:
    def test_faqs_exactly_8_and_dedup_and_mailin(self, s):
        r = s.get(f"{API}/faqs")
        assert r.status_code == 200
        faqs = r.json()
        assert len(faqs) == 8
        qs = [f["question"] for f in faqs]
        assert len(set(qs)) == 8, f"duplicate questions: {qs}"
        combined = " ".join(qs + [f.get("answer", "") for f in faqs]).lower()
        assert "opsturen" in combined or "mail-in" in combined


# Site content
class TestSiteContent:
    def test_hero_and_trust_and_why_and_footer(self, s):
        d = s.get(f"{API}/site-content").json()
        # hero
        assert d["hero"]["badge_text"] == "Broek op Langedijk"
        assert d["hero"].get("rating_line_enabled") is False
        # trust
        labels = [c.get("label") for c in d["trust"]["cards"]]
        assert labels == ["Reparatietijd", "Garantie", "Onderdelen", "Transparant"]
        for c in d["trust"]["cards"]:
            assert c.get("value_type") != "reviews_avg"
        # why
        titles = [i.get("title") for i in d["why"]["items"]]
        icons = [i.get("icon") for i in d["why"]["items"]]
        assert "Ervaren technici" not in titles
        assert "cpu" not in icons
        assert "Broek op Langedijk" in titles
        # footer
        f = d["footer"]
        assert f.get("instagram_url") == "https://www.instagram.com/refixionnl"
        assert f.get("tiktok_url") == "https://www.tiktok.com/@refixionstore"
        assert not f.get("facebook_url")


# SEO deprecated paths
class TestSeoDeprecated:
    @pytest.mark.parametrize("path", ["/business", "/about", "/reviews"])
    def test_deprecated_paths_gone(self, s, path):
        r = s.get(f"{API}/seo", params={"path": path})
        # Acceptable: 404 OR body has no matching path (falls back to default / empty)
        if r.status_code == 200:
            d = r.json()
            # Should NOT be a record specifically for the deprecated path
            assert d.get("path") != path, f"deprecated seo still present for {path}"


# Bookings method validation
class TestBookingMethod:
    def _payload(self, **over):
        p = {
            "brand_id": "brand-apple", "device_id": "dev-ip15p",
            "repair_id": "rep-battery", "method_id": "method-workshop",
            "appointment_date": _next_weekday(), "appointment_time": "10:30",
            "first_name": "TEST", "last_name": "It4", "email": "t4@example.com",
            "phone": "+31612345678", "street": "S", "house_number": "1",
            "postal_code": "1000 AA", "city": "Amsterdam", "consent": True,
        }
        p.update(over)
        return p

    @pytest.mark.parametrize("mid", ["method-pickup", "method-onsite"])
    def test_removed_methods_rejected(self, s, mid):
        r = s.post(f"{API}/bookings", json=self._payload(method_id=mid, appointment_time="10:45"))
        assert r.status_code == 400
        assert "Ongeldige selectie" in r.json().get("detail", "")

    def test_mailin_booking_succeeds(self, s):
        r = s.post(f"{API}/bookings", json=self._payload(method_id="method-mailin", appointment_time="11:15"))
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["reference"].startswith("RFX-")


# Regression basics
class TestRegression:
    def test_brands(self, s):
        brands = s.get(f"{API}/brands").json()
        assert sorted([b["slug"] for b in brands]) == ["apple", "samsung"]

    def test_apple_33(self, s):
        devs = s.get(f"{API}/devices", params={"brand_id": "brand-apple"}).json()
        assert len(devs) == 33

    def test_screen_3_qualities(self, s):
        reps = s.get(f"{API}/repairs", params={"device_id": "dev-ip15p"}).json()
        screen = next(x for x in reps if x["id"] == "rep-screen")
        assert len(screen["part_options"]) == 3

    def test_admin_login(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "admin@refixion.nl", "password": "Refixion2026!"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"
