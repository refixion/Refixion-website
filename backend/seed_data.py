"""Refixion seed data — Apple + Samsung phones only (no tablets)."""

BRANDS = [
    {"id": "brand-apple", "slug": "apple", "name": "Apple", "order": 1, "enabled": True},
    {"id": "brand-samsung", "slug": "samsung", "name": "Samsung", "order": 2, "enabled": True},
]

# Apple iPhone catalog — matches Refixion iPhone repair sheet.
APPLE_DEVICES = [
    ("dev-ip16pm",  "iPhone 16 Pro Max",   True, 1),
    ("dev-ip16p",   "iPhone 16 Pro",       True, 2),
    ("dev-ip16plus","iPhone 16 Plus",      False, 3),
    ("dev-ip16",    "iPhone 16",           True, 4),
    ("dev-ip15pm",  "iPhone 15 Pro Max",   True, 5),
    ("dev-ip15p",   "iPhone 15 Pro",       True, 6),
    ("dev-ip15plus","iPhone 15 Plus",      False, 7),
    ("dev-ip15",    "iPhone 15",           True, 8),
    ("dev-ip14pm",  "iPhone 14 Pro Max",   True, 9),
    ("dev-ip14p",   "iPhone 14 Pro",       False, 10),
    ("dev-ip14plus","iPhone 14 Plus",      False, 11),
    ("dev-ip14",    "iPhone 14",           True, 12),
    ("dev-ip13pm",  "iPhone 13 Pro Max",   False, 13),
    ("dev-ip13p",   "iPhone 13 Pro",       False, 14),
    ("dev-ip13mini","iPhone 13 mini",      False, 15),
    ("dev-ip13",    "iPhone 13",           True, 16),
    ("dev-ip12pm",  "iPhone 12 Pro Max",   False, 17),
    ("dev-ip12p",   "iPhone 12 Pro",       False, 18),
    ("dev-ip12mini","iPhone 12 mini",      False, 19),
    ("dev-ip12",    "iPhone 12",           False, 20),
    ("dev-ip11pm",  "iPhone 11 Pro Max",   False, 21),
    ("dev-ip11p",   "iPhone 11 Pro",       False, 22),
    ("dev-ip11",    "iPhone 11",           True, 23),
    ("dev-ipxsm",   "iPhone XS Max",       False, 24),
    ("dev-ipxs",    "iPhone XS",           False, 25),
    ("dev-ipxr",    "iPhone XR",           False, 26),
    ("dev-ipx",     "iPhone X",            False, 27),
    ("dev-ip8plus", "iPhone 8 Plus",       False, 28),
    ("dev-ip8",     "iPhone 8",            False, 29),
    ("dev-ip7plus", "iPhone 7 Plus",       False, 30),
    ("dev-ip7",     "iPhone 7",            False, 31),
    ("dev-ipse3",   "iPhone SE (2022)",    False, 32),
    ("dev-ipse2",   "iPhone SE (2020)",    False, 33),
]

# Samsung phone catalog (phones only — no tablets).
SAMSUNG_DEVICES = [
    ("dev-sgs24u",  "Galaxy S24 Ultra",    True, 1),
    ("dev-sgs24p",  "Galaxy S24+",         False, 2),
    ("dev-sgs24",   "Galaxy S24",          True, 3),
    ("dev-sgs23u",  "Galaxy S23 Ultra",    True, 4),
    ("dev-sgs23p",  "Galaxy S23+",         False, 5),
    ("dev-sgs23",   "Galaxy S23",          False, 6),
    ("dev-sgs22u",  "Galaxy S22 Ultra",    False, 7),
    ("dev-sgs22p",  "Galaxy S22+",         False, 8),
    ("dev-sgs22",   "Galaxy S22",          False, 9),
    ("dev-sgs21u",  "Galaxy S21 Ultra",    False, 10),
    ("dev-sgs21p",  "Galaxy S21+",         False, 11),
    ("dev-sgs21",   "Galaxy S21",          False, 12),
    ("dev-sgs20u",  "Galaxy S20 Ultra",    False, 13),
    ("dev-sgs20p",  "Galaxy S20+",         False, 14),
    ("dev-sgs20",   "Galaxy S20",          False, 15),
    ("dev-sgn20u",  "Galaxy Note 20 Ultra",False, 16),
    ("dev-sgn20",   "Galaxy Note 20",      False, 17),
    ("dev-sgzf5",   "Galaxy Z Fold 5",     False, 18),
    ("dev-sgzflip5","Galaxy Z Flip 5",     False, 19),
    ("dev-sgzf4",   "Galaxy Z Fold 4",     False, 20),
    ("dev-sgzflip4","Galaxy Z Flip 4",     False, 21),
    ("dev-sga55",   "Galaxy A55",          False, 22),
    ("dev-sga54",   "Galaxy A54",          False, 23),
    ("dev-sga34",   "Galaxy A34",          False, 24),
    ("dev-sga15",   "Galaxy A15",          False, 25),
]

DEVICES = (
    [{"id": i, "brand_id": "brand-apple", "name": n, "popular": pop, "order": o, "enabled": True} for i, n, pop, o in APPLE_DEVICES]
    + [{"id": i, "brand_id": "brand-samsung", "name": n, "popular": pop, "order": o, "enabled": True} for i, n, pop, o in SAMSUNG_DEVICES]
)


# Repair types.
# `has_quality_tiers=True` means a device+repair can have multiple quality options (screen).
# `sheet_price` = the flat starting price we know from the pricing sheet (used to auto-seed part options).
# `on_request` = True → seed as "prijs op aanvraag" (no numeric price).
REPAIRS = [
    {"id": "rep-screen",       "name": "Schermreparatie",         "description": "Vervanging van het scherm met keuze uit meerdere kwaliteiten.",              "duration_minutes": 45, "icon": "monitor-smartphone", "sheet_price": 90, "has_quality_tiers": True,  "on_request": False, "order": 1,  "enabled": True},
    {"id": "rep-battery",      "name": "Batterij vervangen",      "description": "Nieuwe premium batterij voor volledige batterijduur.",                       "duration_minutes": 30, "icon": "battery-charging",   "sheet_price": 50, "has_quality_tiers": False, "on_request": False, "order": 2,  "enabled": True},
    {"id": "rep-backhousing",  "name": "Achterkant vervangen",    "description": "Vervanging van het gebroken achterglas of de achterbehuizing.",              "duration_minutes": 60, "icon": "layers",             "sheet_price": 80, "has_quality_tiers": False, "on_request": False, "order": 3,  "enabled": True},
    {"id": "rep-charging",     "name": "Oplaadpoort",             "description": "Reparatie of vervanging van de laadaansluiting.",                            "duration_minutes": 45, "icon": "plug-zap",           "sheet_price": 70, "has_quality_tiers": False, "on_request": False, "order": 4,  "enabled": True},
    {"id": "rep-camera",       "name": "Achter camera",           "description": "Vervanging van de achtercamera module.",                                     "duration_minutes": 45, "icon": "camera",             "sheet_price": 45, "has_quality_tiers": False, "on_request": False, "order": 5,  "enabled": True},
    {"id": "rep-cameralens",   "name": "Cameralens (camerakas)",  "description": "Vervanging van het cameraglas / de camerakas.",                              "duration_minutes": 40, "icon": "aperture",           "sheet_price": 35, "has_quality_tiers": False, "on_request": False, "order": 6,  "enabled": True},
    {"id": "rep-speaker",      "name": "Luidspreker",             "description": "Vervanging van luidspreker.",                                                "duration_minutes": 40, "icon": "volume-2",           "sheet_price": None,"has_quality_tiers": False, "on_request": True,  "order": 7,  "enabled": True},
    {"id": "rep-earpiece",     "name": "Oorspeaker",              "description": "Vervanging van de oorspeaker aan de bovenkant.",                             "duration_minutes": 40, "icon": "ear",                "sheet_price": None,"has_quality_tiers": False, "on_request": True,  "order": 8,  "enabled": True},
    {"id": "rep-microphone",   "name": "Microfoon",               "description": "Herstel van microfoonproblemen.",                                            "duration_minutes": 40, "icon": "mic",                "sheet_price": None,"has_quality_tiers": False, "on_request": True,  "order": 9,  "enabled": True},
    {"id": "rep-vibration",    "name": "Vibratie motor",          "description": "Vervanging van de trilmotor.",                                               "duration_minutes": 40, "icon": "vibrate",            "sheet_price": None,"has_quality_tiers": False, "on_request": True,  "order": 10, "enabled": True},
    {"id": "rep-buttons",      "name": "Knoppen (Power / Volume)","description": "Reparatie van power-, volume- of muteknop.",                                 "duration_minutes": 45, "icon": "toggle-right",       "sheet_price": None,"has_quality_tiers": False, "on_request": True,  "order": 11, "enabled": True},
    {"id": "rep-faceid",       "name": "Face ID / Touch ID",      "description": "Reparatie van Face ID of Touch ID sensor.",                                  "duration_minutes": 60, "icon": "scan-face",          "sheet_price": None,"has_quality_tiers": False, "on_request": True,  "order": 12, "enabled": True},
    {"id": "rep-water",        "name": "Waterschade behandeling", "description": "Complete diagnose en reiniging bij waterschade.",                            "duration_minutes":120, "icon": "droplets",           "sheet_price": None,"has_quality_tiers": False, "on_request": True,  "order": 13, "enabled": True},
    {"id": "rep-diagnosis",    "name": "Diagnose",                "description": "Uitgebreide diagnose van uw toestel.",                                       "duration_minutes": 30, "icon": "activity",           "sheet_price": 25, "has_quality_tiers": False, "on_request": False, "order": 14, "enabled": True},
]


# Screen quality tiers (used when has_quality_tiers=True).
# Multipliers applied to the sheet_price to seed per-device prices.
SCREEN_QUALITIES = [
    {
        "quality_key": "original",
        "quality_label": "Origineel scherm (OEM)",
        "description": "Het hoogste kwaliteitsniveau. De dichtstbijzijnde ervaring van het originele fabrieksscherm.",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "price_multiplier": 1.0,
        "order": 1,
    },
    {
        "quality_key": "high_quality",
        "quality_label": "High Quality Display (Soft OLED)",
        "description": "Premium aftermarket-scherm met uitstekende kwaliteit en prestaties.",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "price_multiplier": 0.75,
        "order": 2,
    },
    {
        "quality_key": "working",
        "quality_label": "Werkend scherm (gebruikt origineel)",
        "description": "Getest gebruikt origineel scherm. Kan lichte cosmetische sporen van gebruik hebben.",
        "warranty_days": 30,
        "warranty_label": "30 dagen garantie",
        "price_multiplier": 0.55,
        "order": 3,
    },
]

# Standard (single-quality) warranty defaults per repair — used when has_quality_tiers=False.
STANDARD_WARRANTIES = {
    "rep-battery":      {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-backhousing":  {"warranty_days": 365, "warranty_label": "12 maanden garantie op montage"},
    "rep-charging":     {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-camera":       {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-cameralens":   {"warranty_days": 365, "warranty_label": "12 maanden garantie op montage"},
    "rep-speaker":      {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-earpiece":     {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-microphone":   {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-vibration":    {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-buttons":      {"warranty_days": 365, "warranty_label": "12 maanden garantie"},
    "rep-faceid":       {"warranty_days":  90, "warranty_label": "3 maanden garantie"},
    "rep-water":        {"warranty_days":  30, "warranty_label": "30 dagen garantie op de behandeling"},
    "rep-diagnosis":    {"warranty_days":   0, "warranty_label": "Geen garantie (diagnose)"},
}


# Warranty catalog: per repair — what's covered / excluded (shown to customer and admin-editable).
# Screen tiers use their own entry (rep-screen becomes an aggregate; per-quality covers/excludes below).
WARRANTIES = [
    {
        "id": "war-screen-original",
        "repair_id": "rep-screen",
        "quality_key": "original",
        "label": "Origineel scherm",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Touch functionaliteit", "Scherm defect", "Dode pixels", "Fabrieksfouten", "Kleur- of helderheidsfouten veroorzaakt door het vervangingsscherm"],
        "excludes": ["Gebroken glas", "Valschade", "Impactschade", "Drukschade", "Waterschade", "Krassen", "Schade na de reparatie"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-screen-high",
        "repair_id": "rep-screen",
        "quality_key": "high_quality",
        "label": "High Quality Display",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Touch problemen", "Scherm defect", "Dode pixels", "Fabrieksfouten", "Software-onafhankelijke schermproblemen door het onderdeel"],
        "excludes": ["Valschade", "Gebroken scherm", "Drukschade", "Waterschade", "Krassen", "Gebruikersschade"],
        "order": 2, "enabled": True,
    },
    {
        "id": "war-screen-working",
        "repair_id": "rep-screen",
        "quality_key": "working",
        "label": "Werkend scherm",
        "warranty_days": 30,
        "warranty_label": "30 dagen garantie",
        "covers": ["Scherm werkt niet", "Touch defect", "Onverwacht defect zonder gebruikersschade"],
        "excludes": ["Bestaande cosmetische slijtage", "Krassen", "Nieuwe barsten", "Valschade", "Drukschade", "Waterschade", "Gebruikersschade"],
        "order": 3, "enabled": True,
    },
    {
        "id": "war-battery",
        "repair_id": "rep-battery",
        "quality_key": "standard",
        "label": "Batterij",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Batterij defect", "Fabrieksfouten", "Onverwachte uitschakeling door batterijdefect"],
        "excludes": ["Normale batterijveroudering", "Waterschade", "Valschade", "Onjuist gebruik", "Oplaadproblemen door andere componenten"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-backhousing",
        "repair_id": "rep-backhousing",
        "quality_key": "standard",
        "label": "Achterkant",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie op montage",
        "covers": ["Onjuiste installatie", "Lijmfouten", "Fabrieksfouten in vervangglas"],
        "excludes": ["Nieuwe barsten", "Valschade", "Impactschade", "Krassen", "Waterschade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-camera",
        "repair_id": "rep-camera",
        "quality_key": "standard",
        "label": "Camera",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Camera defect", "Autofocus problemen", "Fabrieksfouten", "Cameracomponent defect"],
        "excludes": ["Gekraste cameralens", "Fysieke schade", "Waterschade", "Valschade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-cameralens",
        "repair_id": "rep-cameralens",
        "quality_key": "standard",
        "label": "Cameralens",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie op montage",
        "covers": ["Onjuiste installatie", "Lijmproblemen"],
        "excludes": ["Nieuwe barsten", "Krassen", "Valschade", "Impactschade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-charging",
        "repair_id": "rep-charging",
        "quality_key": "standard",
        "label": "Oplaadpoort",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Oplaadpoort defect", "Componentdefecten", "Reparatie-gerelateerde problemen"],
        "excludes": ["Vuil of stof in de poort", "Verbogen connectors door onjuist gebruik", "Vloeistofschade", "Fysieke schade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-speaker",
        "repair_id": "rep-speaker",
        "quality_key": "standard",
        "label": "Luidspreker",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Luidspreker defect", "Fabrieksfouten", "Reparatie-gerelateerde problemen"],
        "excludes": ["Waterschade", "Vuilblokkering", "Fysieke schade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-earpiece",
        "repair_id": "rep-earpiece",
        "quality_key": "standard",
        "label": "Oorspeaker",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Geen geluid", "Slecht geluid door defect vervangonderdeel"],
        "excludes": ["Waterschade", "Stofblokkering", "Fysieke schade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-microphone",
        "repair_id": "rep-microphone",
        "quality_key": "standard",
        "label": "Microfoon",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Microfoon defect", "Fabrieksfouten"],
        "excludes": ["Waterschade", "Vuilblokkering", "Fysieke schade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-vibration",
        "repair_id": "rep-vibration",
        "quality_key": "standard",
        "label": "Vibratie motor",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Vibratiemotor defect", "Fabrieksfouten"],
        "excludes": ["Valschade", "Waterschade", "Fysieke schade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-buttons",
        "repair_id": "rep-buttons",
        "quality_key": "standard",
        "label": "Knoppen",
        "warranty_days": 365,
        "warranty_label": "12 maanden garantie",
        "covers": ["Knoppen defect", "Reparatie-gerelateerde problemen"],
        "excludes": ["Framebeschadiging", "Valschade", "Waterschade"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-faceid",
        "repair_id": "rep-faceid",
        "quality_key": "standard",
        "label": "Face ID / Touch ID",
        "warranty_days": 90,
        "warranty_label": "3 maanden garantie",
        "covers": ["Reparatie-gerelateerd defect"],
        "excludes": ["Eerdere schade", "Waterschade", "Valschade", "Schade veroorzaakt door andere componenten"],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-water",
        "repair_id": "rep-water",
        "quality_key": "standard",
        "label": "Waterschade behandeling",
        "warranty_days": 30,
        "warranty_label": "30 dagen garantie op de reinigings-/herstelprocedure",
        "covers": ["Onze uitgevoerde reinigings- en herstelprocedure"],
        "excludes": ["Geen garantie op volledige toestelfunctionaliteit — waterschade kan door corrosie toekomstige problemen veroorzaken."],
        "order": 1, "enabled": True,
    },
    {
        "id": "war-diagnosis",
        "repair_id": "rep-diagnosis",
        "quality_key": "standard",
        "label": "Diagnose",
        "warranty_days": 0,
        "warranty_label": "Geen garantie",
        "covers": ["Klant betaalt voor de diagnose en professionele inspectie, geen garantie op reparatiesucces."],
        "excludes": [],
        "order": 1, "enabled": True,
    },
]

GENERAL_WARRANTY_TEXT = (
    "Garantie is uitsluitend van toepassing op het vervangen onderdeel en de uitgevoerde reparatie. "
    "Garantie dekt geen schade veroorzaakt door vallen, stoten, druk, vloeistoffen, krassen, misbruik of externe schade. "
    "Normale slijtage valt niet onder de garantie. Garantie vervalt indien het toestel na de Refixion-reparatie door een andere "
    "reparateur is geopend of aangepast."
)


# Per-device price overrides (real values from the iPhone sheet — flat starter prices).
# Admin can override any of these later.
def build_part_options():
    """
    Build the default part_options collection: for each (device × repair) a part option
    (or multiple for screen). Prices seeded from sheet_price × quality_multiplier.
    """
    options = []
    for dev in DEVICES:
        for repair in REPAIRS:
            base_price = repair.get("sheet_price")
            if repair["has_quality_tiers"]:
                for q in SCREEN_QUALITIES:
                    price = round(base_price * q["price_multiplier"]) if base_price else None
                    options.append({
                        "id": f"po-{dev['id']}-{repair['id']}-{q['quality_key']}",
                        "device_id": dev["id"],
                        "repair_id": repair["id"],
                        "quality_key": q["quality_key"],
                        "quality_label": q["quality_label"],
                        "description": q["description"],
                        "price_eur": price,
                        "on_request": price is None,
                        "warranty_days": q["warranty_days"],
                        "warranty_label": q["warranty_label"],
                        "enabled": True,
                        "order": q["order"],
                    })
            else:
                w = STANDARD_WARRANTIES.get(repair["id"], {"warranty_days": 365, "warranty_label": "12 maanden garantie"})
                options.append({
                    "id": f"po-{dev['id']}-{repair['id']}-standard",
                    "device_id": dev["id"],
                    "repair_id": repair["id"],
                    "quality_key": "standard",
                    "quality_label": "Standaard",
                    "description": repair["description"],
                    "price_eur": base_price,
                    "on_request": repair.get("on_request", False) or base_price is None,
                    "warranty_days": w["warranty_days"],
                    "warranty_label": w["warranty_label"],
                    "enabled": True,
                    "order": 1,
                })
    return options


# Repair methods — only Workshop + Mail-in for now (Pickup + On-site removed per business decision).
REPAIR_METHODS = [
    {"id": "method-workshop", "slug": "workshop", "title": "Bezoek onze werkplaats",   "description": "Breng uw toestel naar onze reparatielocatie. Reparaties worden meestal terwijl u wacht uitgevoerd.", "icon": "store", "estimated_turnaround": "Meestal binnen 1 uur", "additional_price": 0, "info": "Geen extra kosten. Loop binnen of maak een afspraak.", "enabled": True, "order": 1},
    {"id": "method-mailin",   "slug": "mail-in",  "title": "Opsturen (Mail-in)",        "description": "Verstuur uw toestel veilig naar ons via post of koerier. Wij verzorgen de retourzending.",        "icon": "package", "estimated_turnaround": "2 – 4 werkdagen",       "additional_price": 0, "info": "Gratis retourzending binnen Nederland.",         "enabled": True, "order": 2},
]


WORKSHOP = {
    "id": "workshop-default",
    "business_name": "Refixion",
    "workshop_name": "Refixion",
    "address": "Dorpsstraat 51",
    "postal_code": "1721 BB",
    "city": "Broek op Langedijk",
    "country": "Nederland",
    "latitude": 52.6742,
    "longitude": 4.8003,
    "google_maps_link": "https://maps.google.com/?q=Dorpsstraat+51+Broek+op+Langedijk",
    "parking_instructions": "Gratis parkeren voor de deur.",
    "doorbell_instructions": "Loop binnen tijdens openingstijden.",
    "email": "refixionstore@gmail.com",
    "phone": "+31 6 44859536",
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
        "instagram": "https://www.instagram.com/refixionnl",
        "tiktok": "https://www.tiktok.com/@refixionstore",
    },
}


REVIEWS = []


FAQS = [
    {"id": "faq-1", "question": "Hoe lang duurt een reparatie?",              "answer": "De meeste reparaties zijn binnen 30 tot 60 minuten klaar terwijl u wacht. Bij opsturen rekent u op 2 – 4 werkdagen. Complexere reparaties zoals waterschade kunnen 1 – 2 werkdagen duren.", "order": 1},
    {"id": "faq-2", "question": "Wat voor garantie krijg ik?",                "answer": "Op de meeste reparaties krijgt u 12 maanden garantie. Op Face ID reparaties 3 maanden. Op waterschade behandeling 30 dagen. Op tweedehands 'Werkend scherm' 30 dagen. Zie onze Garantie-pagina voor de volledige details per reparatie.", "order": 2},
    {"id": "faq-3", "question": "Wat zijn de verschillen tussen schermkwaliteiten?", "answer": "Wij bieden drie kwaliteiten: Origineel (OEM) is fabrieksniveau met 12 maanden garantie. High Quality Display is premium aftermarket met 12 maanden garantie. Werkend scherm is een getest tweedehands origineel met 30 dagen garantie en lichte cosmetische slijtage.", "order": 3},
    {"id": "faq-4", "question": "Gebruiken jullie originele onderdelen?",      "answer": "Wij bieden zowel originele (OEM) als premium aftermarket onderdelen. U kiest zelf welk kwaliteitsniveau bij u past.", "order": 4},
    {"id": "faq-5", "question": "Wat als mijn toestel niet meer aan gaat?",    "answer": "Geen probleem. Wij voeren eerst een diagnose uit en bespreken vervolgens transparant de reparatiekosten voordat wij beginnen.", "order": 5},
    {"id": "faq-6", "question": "Kan ik betalen na de reparatie?",             "answer": "Ja. Betaling vindt plaats bij oplevering — pin, contant of iDEAL.", "order": 6},
    {"id": "faq-7", "question": "Kan ik mijn toestel opsturen?",               "answer": "Ja. Kies bij de boeking voor 'Opsturen (Mail-in)'. Verstuur uw toestel veilig naar ons — wij verzorgen de retourzending gratis binnen Nederland.", "order": 7},
    {"id": "faq-8", "question": "Wat gebeurt er met mijn data?",               "answer": "Uw data blijft veilig. Wij hebben geen toegang tot uw persoonlijke gegevens. Wij adviseren echter altijd om een back-up te maken vóór de reparatie.", "order": 8},
]
