"""Default site content (homepage) and SEO metadata for Refixion."""

SITE_CONTENT_DEFAULT = {
    "id": "site-content-default",
    "hero": {
        "badge_enabled": True,
        "badge_text": "Vandaag open · Amsterdam",
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
        "rating_line_enabled": True,
        "rating_line_suffix": "Levenslange garantie op scherm",
    },
    "trust": {
        "eyebrow": "Waarom Refixion",
        "heading": "Vertrouwen dat je kunt zien.",
        "cards": [
            {"label": "Gemiddelde rating", "value_type": "reviews_avg", "value": "", "suffix": " ★"},
            {"label": "Tevreden klanten", "value_type": "number", "value": "2500", "suffix": "+"},
            {"label": "Garantie op scherm", "value_type": "text", "value": "Levenslang", "suffix": ""},
            {"label": "Gemiddelde tijd", "value_type": "number", "value": "45", "suffix": " min"},
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
            {"icon": "shield-check", "title": "Garantie", "description": "Levenslange garantie op scherm. 12 maanden op de rest."},
            {"icon": "package", "title": "Transparante prijzen", "description": "De prijs die je online ziet is de prijs die je betaalt."},
            {"icon": "clock", "title": "Snelle service", "description": "De meeste reparaties zijn klaar terwijl u wacht."},
            {"icon": "cpu", "title": "Ervaren technici", "description": "Jarenlange ervaring in premium reparaties."},
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
        "tagline": "Premium smartphone reparaties met volledige transparantie, moderne technologie en uitzonderlijke service.",
        "instagram_url": "https://instagram.com/refixion",
        "facebook_url": "https://facebook.com/refixion",
    },
}


SEO_DEFAULTS = [
    {"path": "/", "title": "Refixion — Premium smartphone reparaties", "description": "Snelle reparaties. Premium onderdelen. Transparante prijzen. Meestal binnen 1 uur klaar.", "og_title": "Refixion — Premium smartphone reparaties", "og_description": "Snelle reparaties. Premium onderdelen. Transparante prijzen.", "og_image": ""},
    {"path": "/repairs", "title": "Reparaties — Refixion", "description": "Kies je merk en model voor een premium reparatie.", "og_title": "Reparaties — Refixion", "og_description": "Apple, Samsung, Google en OnePlus reparaties.", "og_image": ""},
    {"path": "/pricing", "title": "Prijzen — Refixion", "description": "Transparante prijzen zonder verrassingen.", "og_title": "Prijzen — Refixion", "og_description": "De prijs die je ziet is de prijs die je betaalt.", "og_image": ""},
    {"path": "/about", "title": "Over ons — Refixion", "description": "Een premium tech-merk dat toevallig ook repareert.", "og_title": "Over Refixion", "og_description": "", "og_image": ""},
    {"path": "/business", "title": "Zakelijk — Refixion", "description": "Reparaties voor je hele team.", "og_title": "Zakelijk — Refixion", "og_description": "", "og_image": ""},
    {"path": "/faq", "title": "FAQ — Refixion", "description": "Antwoorden op veelgestelde vragen.", "og_title": "FAQ — Refixion", "og_description": "", "og_image": ""},
    {"path": "/reviews", "title": "Reviews — Refixion", "description": "Wat onze klanten zeggen.", "og_title": "Reviews — Refixion", "og_description": "", "og_image": ""},
    {"path": "/contact", "title": "Contact — Refixion", "description": "Neem contact op met Refixion.", "og_title": "Contact — Refixion", "og_description": "", "og_image": ""},
    {"path": "/garantie", "title": "Garantie — Refixion", "description": "Duidelijke garantie op iedere reparatie. Bekijk wat gedekt is per reparatie.", "og_title": "Garantie — Refixion", "og_description": "", "og_image": ""},
    {"path": "/booking", "title": "Boek een reparatie — Refixion", "description": "Boek in enkele stappen jouw premium smartphone reparatie.", "og_title": "Boek een reparatie", "og_description": "", "og_image": ""},
]
