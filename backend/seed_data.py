"""Seed data for Refixion: brands, devices, repairs, repair methods, workshop, reviews, FAQs."""
from datetime import datetime, timezone
import uuid

NOW = lambda: datetime.now(timezone.utc).isoformat()


def _id():
    return str(uuid.uuid4())


BRANDS = [
    {"id": "brand-apple", "slug": "apple", "name": "Apple", "order": 1, "enabled": True},
    {"id": "brand-samsung", "slug": "samsung", "name": "Samsung", "order": 2, "enabled": True},
    {"id": "brand-google", "slug": "google", "name": "Google", "order": 3, "enabled": True},
    {"id": "brand-oneplus", "slug": "oneplus", "name": "OnePlus", "order": 4, "enabled": True},
]

DEVICES = [
    # Apple
    {"id": "dev-ip16pm", "brand_id": "brand-apple", "name": "iPhone 16 Pro Max", "popular": True, "order": 1},
    {"id": "dev-ip16p", "brand_id": "brand-apple", "name": "iPhone 16 Pro", "popular": True, "order": 2},
    {"id": "dev-ip16plus", "brand_id": "brand-apple", "name": "iPhone 16 Plus", "popular": False, "order": 3},
    {"id": "dev-ip16", "brand_id": "brand-apple", "name": "iPhone 16", "popular": True, "order": 4},
    {"id": "dev-ip15pm", "brand_id": "brand-apple", "name": "iPhone 15 Pro Max", "popular": True, "order": 5},
    {"id": "dev-ip15p", "brand_id": "brand-apple", "name": "iPhone 15 Pro", "popular": False, "order": 6},
    {"id": "dev-ip15", "brand_id": "brand-apple", "name": "iPhone 15", "popular": False, "order": 7},
    {"id": "dev-ip14pm", "brand_id": "brand-apple", "name": "iPhone 14 Pro Max", "popular": False, "order": 8},
    {"id": "dev-ip14p", "brand_id": "brand-apple", "name": "iPhone 14 Pro", "popular": False, "order": 9},
    {"id": "dev-ip14", "brand_id": "brand-apple", "name": "iPhone 14", "popular": False, "order": 10},
    {"id": "dev-ip13pm", "brand_id": "brand-apple", "name": "iPhone 13 Pro Max", "popular": False, "order": 11},
    {"id": "dev-ip13p", "brand_id": "brand-apple", "name": "iPhone 13 Pro", "popular": False, "order": 12},
    {"id": "dev-ip13", "brand_id": "brand-apple", "name": "iPhone 13", "popular": False, "order": 13},
    {"id": "dev-ip12pm", "brand_id": "brand-apple", "name": "iPhone 12 Pro Max", "popular": False, "order": 14},
    {"id": "dev-ip12", "brand_id": "brand-apple", "name": "iPhone 12", "popular": False, "order": 15},
    {"id": "dev-ip11pm", "brand_id": "brand-apple", "name": "iPhone 11 Pro Max", "popular": False, "order": 16},
    {"id": "dev-ip11", "brand_id": "brand-apple", "name": "iPhone 11", "popular": False, "order": 17},
    {"id": "dev-ipx", "brand_id": "brand-apple", "name": "iPhone X", "popular": False, "order": 18},
    {"id": "dev-ip8", "brand_id": "brand-apple", "name": "iPhone 8", "popular": False, "order": 19},
    {"id": "dev-ipse3", "brand_id": "brand-apple", "name": "iPhone SE (2022)", "popular": False, "order": 20},
    # Samsung
    {"id": "dev-s24u", "brand_id": "brand-samsung", "name": "Galaxy S24 Ultra", "popular": True, "order": 1},
    {"id": "dev-s24p", "brand_id": "brand-samsung", "name": "Galaxy S24+", "popular": False, "order": 2},
    {"id": "dev-s24", "brand_id": "brand-samsung", "name": "Galaxy S24", "popular": True, "order": 3},
    {"id": "dev-s23u", "brand_id": "brand-samsung", "name": "Galaxy S23 Ultra", "popular": False, "order": 4},
    {"id": "dev-s23", "brand_id": "brand-samsung", "name": "Galaxy S23", "popular": False, "order": 5},
    {"id": "dev-s22", "brand_id": "brand-samsung", "name": "Galaxy S22", "popular": False, "order": 6},
    {"id": "dev-znf5", "brand_id": "brand-samsung", "name": "Galaxy Z Fold 5", "popular": False, "order": 7},
    {"id": "dev-zfl5", "brand_id": "brand-samsung", "name": "Galaxy Z Flip 5", "popular": False, "order": 8},
    # Google
    {"id": "dev-p8p", "brand_id": "brand-google", "name": "Pixel 8 Pro", "popular": True, "order": 1},
    {"id": "dev-p8", "brand_id": "brand-google", "name": "Pixel 8", "popular": True, "order": 2},
    {"id": "dev-p7p", "brand_id": "brand-google", "name": "Pixel 7 Pro", "popular": False, "order": 3},
    {"id": "dev-p7", "brand_id": "brand-google", "name": "Pixel 7", "popular": False, "order": 4},
    {"id": "dev-p6", "brand_id": "brand-google", "name": "Pixel 6", "popular": False, "order": 5},
    # OnePlus
    {"id": "dev-op12", "brand_id": "brand-oneplus", "name": "OnePlus 12", "popular": True, "order": 1},
    {"id": "dev-op11", "brand_id": "brand-oneplus", "name": "OnePlus 11", "popular": False, "order": 2},
    {"id": "dev-op10p", "brand_id": "brand-oneplus", "name": "OnePlus 10 Pro", "popular": False, "order": 3},
    {"id": "dev-op9p", "brand_id": "brand-oneplus", "name": "OnePlus 9 Pro", "popular": False, "order": 4},
]


def _rep(rid, name, description, duration, price, warranty="12 maanden garantie", icon="smartphone"):
    return {
        "id": rid,
        "name": name,
        "description": description,
        "duration_minutes": duration,
        "price_eur": price,
        "warranty": warranty,
        "icon": icon,
        "enabled": True,
    }


# Base repair catalog — every device gets the same set; prices differ per-device via overrides.
REPAIRS = [
    _rep("rep-screen", "Schermreparatie", "Premium OLED/LCD-scherm vervanging met originele kwaliteit.", 45, 89, "Levenslange garantie", "monitor-smartphone"),
    _rep("rep-battery", "Batterij vervangen", "Nieuwe premium batterij voor volledige batterijduur.", 30, 59, "12 maanden garantie", "battery-charging"),
    _rep("rep-backglass", "Achterglas vervangen", "Vervanging van gebroken achterglas met originele afwerking.", 60, 79, "12 maanden garantie", "layers"),
    _rep("rep-charging", "Oplaadpoort", "Reparatie of vervanging van de laadaansluiting.", 45, 69, "12 maanden garantie", "plug-zap"),
    _rep("rep-camera", "Camera reparatie", "Vervanging van voor- of achtercamera module.", 45, 79, "12 maanden garantie", "camera"),
    _rep("rep-speaker", "Luidspreker", "Vervanging van luidspreker of oorspeaker.", 40, 65, "12 maanden garantie", "volume-2"),
    _rep("rep-microphone", "Microfoon", "Herstel van microfoonproblemen.", 40, 59, "12 maanden garantie", "mic"),
    _rep("rep-buttons", "Knoppen", "Reparatie van power-, volume- of muteknop.", 45, 55, "12 maanden garantie", "toggle-right"),
    _rep("rep-water", "Waterschade behandeling", "Complete diagnose en behandeling van waterschade.", 120, 99, "Geen garantie op waterschade", "droplets"),
    _rep("rep-diagnosis", "Diagnose", "Uitgebreide diagnose van uw toestel.", 30, 25, "n.v.t.", "activity"),
    _rep("rep-faceid", "Face ID / Touch ID", "Reparatie van Face ID of Touch ID sensor.", 60, 89, "12 maanden garantie", "scan-face"),
]


# Repair method defaults
REPAIR_METHODS = [
    {
        "id": "method-workshop",
        "slug": "workshop",
        "title": "Bezoek onze werkplaats",
        "description": "Breng uw toestel naar onze reparatielocatie. Reparaties worden meestal terwijl u wacht uitgevoerd.",
        "icon": "store",
        "estimated_turnaround": "Meestal binnen 1 uur",
        "additional_price": 0,
        "info": "Geen extra kosten. Loop binnen of maak een afspraak.",
        "enabled": True,
        "order": 1,
    },
    {
        "id": "method-mailin",
        "slug": "mail-in",
        "title": "Opsturen (Mail-in)",
        "description": "Verstuur uw toestel veilig naar ons via post of koerier. Wij verzorgen de retourzending.",
        "icon": "package",
        "estimated_turnaround": "2 – 4 werkdagen",
        "additional_price": 0,
        "info": "Gratis retourzending binnen Nederland.",
        "enabled": True,
        "order": 2,
    },
    {
        "id": "method-pickup",
        "slug": "pickup",
        "title": "Ophaalservice",
        "description": "Wij komen uw toestel bij u thuis of op kantoor ophalen en brengen het na reparatie terug.",
        "icon": "truck",
        "estimated_turnaround": "1 – 2 werkdagen",
        "additional_price": 19,
        "info": "Beschikbaar in de regio Randstad.",
        "enabled": True,
        "order": 3,
    },
    {
        "id": "method-onsite",
        "slug": "onsite",
        "title": "On-site voor bedrijven",
        "description": "Voor zakelijke klanten: onze technicus komt naar uw kantoor voor snelle reparaties ter plaatse.",
        "icon": "briefcase",
        "estimated_turnaround": "Op afspraak",
        "additional_price": 49,
        "info": "Vanaf 5 toestellen op locatie.",
        "enabled": True,
        "order": 4,
    },
]


WORKSHOP = {
    "id": "workshop-default",
    "business_name": "Refixion",
    "workshop_name": "Refixion Werkplaats Amsterdam",
    "address": "Herengracht 182",
    "postal_code": "1016 BR",
    "city": "Amsterdam",
    "country": "Nederland",
    "latitude": 52.3702,
    "longitude": 4.8952,
    "google_maps_link": "https://maps.google.com/?q=Herengracht+182+Amsterdam",
    "parking_instructions": "Betaald parkeren in de omgeving. Gratis parkeren mogelijk in P+R Zeeburg (10 min metro).",
    "doorbell_instructions": "Aanbellen bij 'Refixion' — begane grond.",
    "email": "hello@refixion.nl",
    "phone": "+31 20 123 4567",
    "opening_hours": {
        "monday": {"open": "09:00", "close": "18:00", "closed": False},
        "tuesday": {"open": "09:00", "close": "18:00", "closed": False},
        "wednesday": {"open": "09:00", "close": "18:00", "closed": False},
        "thursday": {"open": "09:00", "close": "20:00", "closed": False},
        "friday": {"open": "09:00", "close": "18:00", "closed": False},
        "saturday": {"open": "10:00", "close": "17:00", "closed": False},
        "sunday": {"open": "00:00", "close": "00:00", "closed": True},
    },
    "closed_days": [],
    "max_bookings_per_day": 20,
    "appointment_interval_minutes": 30,
    "socials": {
        "instagram": "https://instagram.com/refixion",
        "facebook": "https://facebook.com/refixion",
    },
}


REVIEWS = [
    {"id": _id(), "name": "Sanne de Vries", "rating": 5, "date": "2025-11-14", "text": "Binnen 40 minuten was mijn iPhone 15 Pro-scherm vervangen. Perfect resultaat, keurige service en eerlijke prijs. Absolute aanrader.", "device": "iPhone 15 Pro"},
    {"id": _id(), "name": "Mark Jansen", "rating": 5, "date": "2025-11-02", "text": "Zeer professionele werkwijze. De technicus legde alles duidelijk uit voordat hij begon. Prijs precies zoals gecommuniceerd, geen verrassingen achteraf.", "device": "Samsung Galaxy S24"},
    {"id": _id(), "name": "Emma van den Berg", "rating": 5, "date": "2025-10-28", "text": "Batterij van mijn iPhone was op. Refixion kwam mijn toestel ophalen en dezelfde dag weer terugbrengen. Ongelooflijk gemak.", "device": "iPhone 13"},
    {"id": _id(), "name": "Lars Bakker", "rating": 5, "date": "2025-10-19", "text": "De strakste repair-ervaring die ik ooit heb gehad. Voelt echt als een premium tech merk, geen typische telefoonwinkel.", "device": "Pixel 8 Pro"},
    {"id": _id(), "name": "Julia Smit", "rating": 5, "date": "2025-10-08", "text": "Waterschade aan mijn iPhone. Andere winkels wilden hem afschrijven. Refixion heeft hem gered. Enorm dankbaar.", "device": "iPhone 14"},
    {"id": _id(), "name": "Thijs Peters", "rating": 4, "date": "2025-09-30", "text": "Snelle service en nette communicatie. Enige minpunt: de wachtruimte was even druk. Verder top.", "device": "OnePlus 11"},
]


FAQS = [
    {"id": _id(), "question": "Hoe lang duurt een reparatie?", "answer": "De meeste reparaties zijn binnen 30 tot 60 minuten klaar terwijl u wacht. Complexere reparaties zoals waterschade of moederbordreparaties kunnen 1 – 2 werkdagen duren.", "order": 1},
    {"id": _id(), "question": "Krijg ik garantie op de reparatie?", "answer": "Ja. Op alle schermreparaties geven wij levenslange garantie op het scherm. Op overige reparaties krijgt u 12 maanden garantie op onderdelen en werk.", "order": 2},
    {"id": _id(), "question": "Gebruiken jullie originele onderdelen?", "answer": "Wij gebruiken uitsluitend premium onderdelen — OEM of van originele kwaliteit — die voldoen aan of overtreffen de fabrieksspecificaties.", "order": 3},
    {"id": _id(), "question": "Wat als mijn toestel niet meer aan gaat?", "answer": "Geen probleem. Wij voeren eerst een gratis diagnose uit en bespreken vervolgens transparant de reparatiekosten voordat wij beginnen.", "order": 4},
    {"id": _id(), "question": "Kan ik betalen na de reparatie?", "answer": "Ja. Betaling vindt plaats bij oplevering — pin, contant, iDEAL of factuur voor zakelijke klanten.", "order": 5},
    {"id": _id(), "question": "Halen jullie mijn toestel op?", "answer": "Ja, wij bieden een ophaalservice in de Randstad. Wij komen uw toestel ophalen en brengen het na reparatie weer terug bij u thuis of op kantoor.", "order": 6},
    {"id": _id(), "question": "Wat gebeurt er met mijn data?", "answer": "Uw data blijft veilig. Wij hebben geen toegang tot uw persoonlijke gegevens. Wij adviseren echter altijd om een back-up te maken vóór de reparatie.", "order": 7},
    {"id": _id(), "question": "Kunnen jullie ook zakelijke reparaties uitvoeren?", "answer": "Zeker. Wij bieden speciale zakelijke pakketten, on-site reparaties en volumekortingen. Neem contact op via onze Business pagina.", "order": 8},
]
