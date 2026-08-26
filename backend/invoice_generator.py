from io import BytesIO
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from zoneinfo import ZoneInfo
import html

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)


# =========================================================
# REFIXION BEDRIJFSGEGEVENS
# =========================================================

BUSINESS_NAME = "Refixion"
BUSINESS_ADDRESS = "Dorpsstraat 51"
BUSINESS_POSTAL_CODE = "1721BB"
BUSINESS_CITY = "Broek op Langedijk"
BUSINESS_COUNTRY = "Nederland"

KVK_NUMBER = "42131896"
VAT_NUMBER = "NL005520371B37"

PHONE_NUMBER = "06 44859536"
EMAIL_ADDRESS = "info@refixion.nl"
WEBSITE = "refixion.nl"


# =========================================================
# BRANDING
# =========================================================

# invoice_generator.py staat in:
#
# Refixion-website/backend/invoice_generator.py
#
# Logo staat in:
#
# Refixion-website/frontend/public/brand/refixion-logo.png
#
LOGO_PATH = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "public"
    / "brand"
    / "refixion-logo.png"
)


# =========================================================
# BRAND COLORS
# =========================================================

BLACK = colors.HexColor("#111111")
DARK = colors.HexColor("#222222")
GRAY = colors.HexColor("#666666")
MID_GRAY = colors.HexColor("#999999")
LIGHT_GRAY = colors.HexColor("#F6F6F6")
BORDER = colors.HexColor("#E5E5E5")
WHITE = colors.white


# =========================================================
# BTW
# =========================================================

VAT_RATE = Decimal("0.21")


def money(value):
    """
    Zet een bedrag veilig om naar Decimal met 2 decimalen.
    """
    if value is None:
        return Decimal("0.00")

    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def euro(value):
    """
    Nederlandse euro-opmaak:
    1234.56 -> € 1.234,56
    """
    value = money(value)

    return (
        f"€ {value:,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )


def calculate_vat_from_inclusive(total):
    """
    Bereken het BTW-bedrag uit een bedrag inclusief 21% BTW.
    """
    total = money(total)

    vat = total * VAT_RATE / (Decimal("1.00") + VAT_RATE)

    return vat.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def safe_text(value):
    """
    Escape tekst voordat deze in ReportLab Paragraph HTML terechtkomt.
    """
    if value is None:
        return ""

    return html.escape(str(value))


# =========================================================
# PDF GENERATOR
# =========================================================

def generate_invoice_pdf(order, order_items):
    """
    Genereert een professionele Refixion webshopfactuur.

    Geeft de PDF terug als bytes.
    """

    buffer = BytesIO()

    # =====================================================
    # DOCUMENT
    # =====================================================

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=20 * mm,
        title=f"Factuur {order.invoice_number or order.order_number}",
        author="Refixion",
        subject="Factuur",
    )

    # =====================================================
    # STYLES
    # =====================================================

    styles = getSampleStyleSheet()

    normal = ParagraphStyle(
        "InvoiceNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=DARK,
        spaceAfter=0,
    )

    body = ParagraphStyle(
        "InvoiceBody",
        parent=normal,
        fontSize=9,
        leading=13,
    )

    small = ParagraphStyle(
        "InvoiceSmall",
        parent=normal,
        fontSize=7.5,
        leading=10,
        textColor=GRAY,
    )

    tiny = ParagraphStyle(
        "InvoiceTiny",
        parent=normal,
        fontSize=6.8,
        leading=9,
        textColor=MID_GRAY,
    )

    section_label = ParagraphStyle(
        "SectionLabel",
        parent=normal,
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=GRAY,
        spaceAfter=2,
    )

    right = ParagraphStyle(
        "Right",
        parent=normal,
        alignment=TA_RIGHT,
    )

    right_small = ParagraphStyle(
        "RightSmall",
        parent=small,
        alignment=TA_RIGHT,
    )

    product = ParagraphStyle(
        "Product",
        parent=normal,
        fontSize=8.8,
        leading=12,
        textColor=BLACK,
    )

    option = ParagraphStyle(
        "Option",
        parent=normal,
        fontSize=7.5,
        leading=10,
        textColor=GRAY,
    )

    table_header = ParagraphStyle(
        "TableHeader",
        parent=normal,
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=WHITE,
    )

    table_header_right = ParagraphStyle(
        "TableHeaderRight",
        parent=table_header,
        alignment=TA_RIGHT,
    )

    total_label = ParagraphStyle(
        "TotalLabel",
        parent=normal,
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        alignment=TA_RIGHT,
        textColor=BLACK,
    )

    total_value = ParagraphStyle(
        "TotalValue",
        parent=normal,
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        alignment=TA_RIGHT,
        textColor=BLACK,
    )

    paid_style = ParagraphStyle(
        "Paid",
        parent=normal,
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
        textColor=BLACK,
    )

    story = []

    # =====================================================
    # DATUM / TIJD
    # =====================================================
    #
    # Geen UTC meer.
    #
    # Facturen gebruiken de Nederlandse tijdzone:
    # Europe/Amsterdam
    #
    # Hierdoor kan de factuur rond middernacht niet ineens
    # een verkeerde datum krijgen omdat Vercel in UTC draait.
    #

    now_netherlands = datetime.now(
        ZoneInfo("Europe/Amsterdam")
    )

    invoice_date = now_netherlands.strftime("%d-%m-%Y")

    # =====================================================
    # HEADER
    # =====================================================

    if LOGO_PATH.exists():
        logo = Image(
            str(LOGO_PATH),
            width=42 * mm,
            height=14 * mm,
            kind="proportional",
        )
    else:
        # Fallback wanneer het logo niet gevonden wordt.
        logo = Paragraph(
            "<b>REFIXION</b>",
            ParagraphStyle(
                "LogoFallback",
                parent=normal,
                fontName="Helvetica-Bold",
                fontSize=20,
                leading=24,
                textColor=BLACK,
            ),
        )

    invoice_title = Paragraph(
        "FACTUUR",
        ParagraphStyle(
            "InvoiceTitle",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            alignment=TA_RIGHT,
            textColor=BLACK,
        ),
    )

    header = Table(
        [[logo, invoice_title]],
        colWidths=[
            105 * mm,
            68 * mm,
        ],
    )

    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),

                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    story.append(header)
    story.append(Spacer(1, 6 * mm))

    # Subtiele lijn
    divider = Table(
        [[""]],
        colWidths=[173 * mm],
        rowHeights=[0.5 * mm],
    )

    divider.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLACK),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    story.append(divider)
    story.append(Spacer(1, 8 * mm))

    # =====================================================
    # FACTUURGEGEVENS
    # =====================================================

    invoice_number = (
        order.invoice_number
        if order.invoice_number
        else "Wordt aangemaakt"
    )

    order_number = safe_text(order.order_number)

    business_block = Paragraph(
        f"""
        <font color="#666666" size="7"><b>VAN</b></font>
        <br/>
        <font color="#111111" size="10">
            <b>{BUSINESS_NAME}</b>
        </font>
        <br/>
        {BUSINESS_ADDRESS}
        <br/>
        {BUSINESS_POSTAL_CODE} {BUSINESS_CITY}
        <br/>
        {BUSINESS_COUNTRY}
        <br/>
        <br/>
        KVK: {KVK_NUMBER}
        <br/>
        BTW-id: {VAT_NUMBER}
        """,
        body,
    )

    invoice_block = Paragraph(
        f"""
        <font color="#666666" size="7"><b>FACTUURGEGEVENS</b></font>
        <br/><br/>
        <b>Factuurnummer</b>
        &nbsp;&nbsp; {safe_text(invoice_number)}
        <br/>
        <b>Factuurdatum</b>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice_date}
        <br/>
        <b>Ordernummer</b>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {order_number}
        """,
        body,
    )

    info_table = Table(
        [[business_block, invoice_block]],
        colWidths=[
            95 * mm,
            78 * mm,
        ],
    )

    info_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),

                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    story.append(info_table)
    story.append(Spacer(1, 9 * mm))

    # =====================================================
    # KLANT
    # =====================================================

    first_name = safe_text(order.first_name)
    last_name = safe_text(order.last_name)
    street = safe_text(order.street)
    house_number = safe_text(order.house_number)
    postal_code = safe_text(order.postal_code)
    city = safe_text(order.city)
    country = safe_text(order.country)
    email = safe_text(order.email)

    customer_block = Paragraph(
        f"""
        <font color="#666666" size="7">
            <b>FACTUUR AAN</b>
        </font>
        <br/>
        <font color="#111111" size="10">
            <b>{first_name} {last_name}</b>
        </font>
        <br/>
        {street} {house_number}
        <br/>
        {postal_code} {city}
        <br/>
        {country}
        <br/>
        <font color="#666666">{email}</font>
        """,
        body,
    )

    customer_table = Table(
        [[customer_block]],
        colWidths=[173 * mm],
    )

    customer_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),

                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),

                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    story.append(customer_table)
    story.append(Spacer(1, 9 * mm))

    # =====================================================
    # PRODUCTEN
    # =====================================================

    rows = [
        [
            Paragraph("PRODUCT", table_header),
            Paragraph("AANTAL", table_header_right),
            Paragraph("PRIJS", table_header_right),
            Paragraph("TOTAAL", table_header_right),
        ]
    ]

    for item in order_items:

        product_title = safe_text(item.product_title)

        rows.append(
            [
                Paragraph(
                    product_title,
                    product,
                ),
                Paragraph(
                    str(item.quantity),
                    right,
                ),
                Paragraph(
                    euro(item.unit_price),
                    right,
                ),
                Paragraph(
                    euro(item.line_total),
                    right,
                ),
            ]
        )

        # -------------------------------------------------
        # PRODUCTOPTIES
        # -------------------------------------------------

        if item.options:

            for option_data in item.options:

                option_name = safe_text(
                    option_data.get("name", "")
                )

                option_price = money(
                    option_data.get("price", 0)
                )

                rows.append(
                    [
                        Paragraph(
                            f"&nbsp;&nbsp;&nbsp;{option_name}",
                            option,
                        ),
                        "",
                        Paragraph(
                            euro(option_price),
                            right_small,
                        ),
                        "",
                    ]
                )

    product_table = Table(
        rows,
        colWidths=[
            82 * mm,
            22 * mm,
            34 * mm,
            35 * mm,
        ],
        repeatRows=1,
    )

    product_table.setStyle(
        TableStyle(
            [
                # Header
                ("BACKGROUND", (0, 0), (-1, 0), BLACK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),

                # Alignment
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),

                # Lines
                ("LINEBELOW", (0, 1), (-1, -1), 0.4, BORDER),

                # Header padding
                ("TOPPADDING", (0, 0), (-1, 0), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 3 * mm),

                # Body padding
                ("TOPPADDING", (0, 1), (-1, -1), 2.8 * mm),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 2.8 * mm),

                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )

    story.append(product_table)
    story.append(Spacer(1, 7 * mm))

    # =====================================================
    # TOTALEN
    # =====================================================

    subtotal = money(order.subtotal)
    shipping = money(order.shipping_cost)
    total_inclusive = money(order.total_price)

    # Totaal incl. BTW -> BTW terugrekenen
    vat_amount = calculate_vat_from_inclusive(
        total_inclusive
    )

    total_exclusive = (
        total_inclusive - vat_amount
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    totals = [
        [
            Paragraph("Subtotaal", right),
            Paragraph(euro(subtotal), right),
        ],
        [
            Paragraph("Verzending", right),
            Paragraph(euro(shipping), right),
        ],
        [
            Paragraph("Bedrag excl. BTW", right),
            Paragraph(euro(total_exclusive), right),
        ],
        [
            Paragraph(
                f"BTW ({int(VAT_RATE * 100)}%)",
                right,
            ),
            Paragraph(euro(vat_amount), right),
        ],
        [
            Paragraph(
                "Totaal incl. BTW",
                total_label,
            ),
            Paragraph(
                euro(total_inclusive),
                total_value,
            ),
        ],
    ]

    totals_table = Table(
        totals,
        colWidths=[
            138 * mm,
            35 * mm,
        ],
    )

    totals_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),

                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),

                ("TOPPADDING", (0, 0), (-1, 3), 1.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, 3), 1.5 * mm),

                # Scheidingslijn voor eindtotaal
                ("LINEABOVE", (0, 4), (-1, 4), 0.8, BLACK),

                ("TOPPADDING", (0, 4), (-1, 4), 4 * mm),
                ("BOTTOMPADDING", (0, 4), (-1, 4), 3 * mm),
            ]
        )
    )

    story.append(totals_table)
    story.append(Spacer(1, 6 * mm))

    # =====================================================
    # BETAALSTATUS
    # =====================================================

    paid_label = Paragraph(
        "BETAALD",
        paid_style,
    )

    paid_amount = Paragraph(
        f"<b>{euro(total_inclusive)}</b>",
        ParagraphStyle(
            "PaidAmount",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            alignment=TA_RIGHT,
            textColor=BLACK,
        ),
    )

    payment_table = Table(
        [[paid_label, paid_amount]],
        colWidths=[
            25 * mm,
            148 * mm,
        ],
    )

    payment_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),

                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
            ]
        )
    )

    story.append(payment_table)
    story.append(Spacer(1, 9 * mm))

    # =====================================================
    # BEDANKT
    # =====================================================

    story.append(
        Paragraph(
            "<b>Bedankt voor je bestelling bij Refixion.</b>",
            ParagraphStyle(
                "Thanks",
                parent=normal,
                fontSize=10,
                leading=14,
                textColor=BLACK,
            ),
        )
    )

    story.append(Spacer(1, 1.5 * mm))

    story.append(
        Paragraph(
            "We hopen je snel weer van dienst te mogen zijn.",
            small,
        )
    )

    story.append(Spacer(1, 7 * mm))

    # =====================================================
    # CONTACTGEGEVENS
    # =====================================================

    contact = Paragraph(
        f"""
        <b>{BUSINESS_NAME}</b>
        &nbsp;&nbsp;•&nbsp;&nbsp;
        {WEBSITE}
        &nbsp;&nbsp;•&nbsp;&nbsp;
        {EMAIL_ADDRESS}
        &nbsp;&nbsp;•&nbsp;&nbsp;
        {PHONE_NUMBER}
        <br/>
        KVK {KVK_NUMBER}
        &nbsp;&nbsp;•&nbsp;&nbsp;
        BTW-id {VAT_NUMBER}
        """,
        tiny,
    )

    contact_table = Table(
        [[contact]],
        colWidths=[173 * mm],
    )

    contact_table.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, -1), 0.5, BORDER),

                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),

                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    story.append(contact_table)

    # =====================================================
    # FOOTER
    # =====================================================

    def draw_footer(canvas, doc):
        canvas.saveState()

        width, height = A4

        # Dunne lijn onderaan
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.4)

        canvas.line(
            18 * mm,
            11 * mm,
            width - 18 * mm,
            11 * mm,
        )

        canvas.setFont(
            "Helvetica",
            6.8,
        )

        canvas.setFillColor(
            MID_GRAY
        )

        canvas.drawString(
            18 * mm,
            7 * mm,
            "Deze factuur is automatisch gegenereerd door Refixion.",
        )

        canvas.drawRightString(
            width - 18 * mm,
            7 * mm,
            f"Pagina {doc.page}",
        )

        canvas.restoreState()

    # =====================================================
    # PDF BUILD
    # =====================================================

    document.build(
        story,
        onFirstPage=draw_footer,
        onLaterPages=draw_footer,
    )

    pdf = buffer.getvalue()

    buffer.close()

    return pdf