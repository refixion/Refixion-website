"""Default site content (homepage) and SEO metadata for Refixion."""

SITE_CONTENT_DEFAULT = {
    "id": "site-content-default",
    "hero": {
        "badge_enabled": True,
        "badge_text": "Broek op Langedijk",
        "headline_line1": "Professionele smartphone­reparaties.",
        "headline_line2": "Zonder gedoe.",
        "subtitle": "Snelle reparaties. Premium onderdelen. Transparante prijzen. Vertrouwde service, meestal binnen 1 uur klaar.",
        "primary_button_label": "Reparatie boeken",
        "primary_button_link": "/booking",
        "secondary_button_label": "Bekijk prijzen",
        "secondary_button_link": "/pricing",
        "hero_image_url": "https://images.unsplash.com/photo-1758186334264-d1ab8a079aa2?auto=format&fit=crop&w=1000&q=80",
        "floating_cards": [
            {"icon": "shield-check", "text": "Garantie inbegrepen"},
            {"icon": "zap", "text": "Klaar binnen 1 uur"},
            {"icon": "sparkles", "text": "Premium onderdelen"},
        ],
        "rating_line_enabled": False,
        "rating_line_suffix": "Levenslange garantie op scherm",
    },
    "trust": {
        "eyebrow": "Waarom Refixion",
        "heading": "Vertrouwen dat je kunt zien.",
        "cards": [
            {"label": "Reparatietijd", "value_type": "text", "value": "± 45 min", "suffix": ""},
            {"label": "Garantie", "value_type": "text", "value": "Tot 12 maanden", "suffix": ""},
            {"label": "Onderdelen", "value_type": "text", "value": "Premium OEM / OLED", "suffix": ""},
            {"label": "Transparant", "value_type": "text", "value": "Vaste prijs", "suffix": ""},
        ],
    },
    "how_it_works": {
        "eyebrow": "Hoe het werkt",
        "heading": "Vijf stappen. Één gerepareerd toestel.",
        "steps": [
            {"title": "Kies je toestel", "description": "Selecteer je merk en model."},
            {"title": "Kies reparatie", "description": "Zie prijs, duur en garantie."},
            {"title": "Boek afspraak", "description": "Kies datum, tijd en methode."},
            {"title": "Wij repareren", "description": "Meestal terwijl u wacht."},
            {"title": "Klaar om te gaan", "description": "Met garantie en zonder gedoe."},
        ],
    },
    "brands_section": {
        "eyebrow": "Ondersteunde merken",
        "heading": "Repareer elk toestel dat je bezit.",
    },
    "why": {
        "eyebrow": "Onze belofte",
        "heading": "Elk detail. Zorgvuldig doordacht.",
        "items": [
            {"icon": "sparkles", "title": "Premium onderdelen", "description": "OEM en originele kwaliteit — nooit generieke troep."},
            {"icon": "wrench", "title": "Professioneel gereedschap", "description": "Gekalibreerd apparaat voor herhaalbare precisie."},
            {"icon": "shield-check", "title": "Garantie", "description": "Duidelijke garantie op elke reparatie. Tot 12 maanden op de meeste onderdelen."},
            {"icon": "package", "title": "Transparante prijzen", "description": "De prijs die je online ziet is de prijs die je betaalt."},
            {"icon": "clock", "title": "Snelle service", "description": "De meeste reparaties zijn klaar terwijl u wacht."},
            {"icon": "map-pin", "title": "Broek op Langedijk", "description": "Loop binnen op Dorpsstraat 51 of stuur uw toestel op."},
        ],
    },
    "reviews_section": {
        "eyebrow": "Wat klanten zeggen",
        "heading_template": "Beoordeeld met {avg} van 5.",
        "link_label": "Alle reviews bekijken",
    },
    "faq_section": {
        "eyebrow": "Veelgestelde vragen",
        "heading": "Alles wat je moet weten.",
        "link_label": "Alle vragen bekijken",
    },
    "cta": {
        "heading": "Klaar om je toestel te repareren?",
        "subtitle": "Boek vandaag nog een afspraak. Meestal binnen 1 uur klaar.",
        "button_label": "Reparatie boeken",
        "button_link": "/booking",
    },
    "footer": {
        "tagline": "Premium smartphone reparaties met volledige transparantie en moderne technologie.",
        "instagram_url": "https://www.instagram.com/refixionnl",
        "tiktok_url": "https://www.tiktok.com/@refixionstore",
        "facebook_url": "",
    },
}


SEO_DEFAULTS = [
    {"path": "/", "title": "Refixion — Premium smartphone reparaties", "description": "Snelle reparaties. Premium onderdelen. Transparante prijzen. Broek op Langedijk.", "og_title": "Refixion — Premium smartphone reparaties", "og_description": "Snelle reparaties. Premium onderdelen. Transparante prijzen.", "og_image": ""},
    {"path": "/repairs", "title": "Reparaties — Refixion", "description": "Kies je merk en model voor een premium reparatie.", "og_title": "Reparaties — Refixion", "og_description": "Apple en Samsung reparaties.", "og_image": ""},
    {"path": "/pricing", "title": "Prijzen — Refixion", "description": "Transparante prijzen zonder verrassingen.", "og_title": "Prijzen — Refixion", "og_description": "De prijs die je ziet is de prijs die je betaalt.", "og_image": ""},
    {"path": "/faq", "title": "FAQ — Refixion", "description": "Antwoorden op veelgestelde vragen.", "og_title": "FAQ — Refixion", "og_description": "", "og_image": ""},
    {"path": "/contact", "title": "Contact — Refixion", "description": "Neem contact op met Refixion. Dorpsstraat 51, Broek op Langedijk.", "og_title": "Contact — Refixion", "og_description": "", "og_image": ""},
    {"path": "/garantie", "title": "Garantie — Refixion", "description": "Duidelijke garantie op iedere reparatie. Bekijk wat gedekt is per reparatie.", "og_title": "Garantie — Refixion", "og_description": "", "og_image": ""},
    {"path": "/booking", "title": "Boek een reparatie — Refixion", "description": "Boek in enkele stappen jouw premium smartphone reparatie.", "og_title": "Boek een reparatie", "og_description": "", "og_image": ""},
]
