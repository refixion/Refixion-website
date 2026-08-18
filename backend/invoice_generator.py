from io import BytesIO
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


BUSINESS_NAME = "Refixion"
BUSINESS_ADDRESS = "Dorpsstraat 51"
BUSINESS_POSTAL_CODE = "1721BB"
BUSINESS_CITY = "Broek op Langedijk"
BUSINESS_COUNTRY = "Nederland"

KVK_NUMBER = "42131896"

# Vul hier je echte btw-id in
VAT_NUMBER = "NL005520371B37"


def generate_invoice_pdf(order, order_items):
    """
    Genereert een PDF-factuur voor een betaalde webshoporder.

    Geeft de PDF terug als bytes.
    """

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45,
    )

    styles = getSampleStyleSheet()

    normal = ParagraphStyle(
        "InvoiceNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
    )

    small = ParagraphStyle(
        "InvoiceSmall",
        parent=normal,
        fontSize=8,
        textColor=colors.HexColor("#666666"),
    )

    right = ParagraphStyle(
        "InvoiceRight",
        parent=normal,
        alignment=TA_RIGHT,
    )

    title = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        spaceAfter=8,
    )

    story = []

    # ---------------------------------------------------------
    # HEADER
    # ---------------------------------------------------------

    header = Table(
        [
            [
                Paragraph(
                    "<b>REFIXION</b>",
                    ParagraphStyle(
                        "Logo",
                        parent=normal,
                        fontName="Helvetica-Bold",
                        fontSize=20,
                    ),
                ),
                Paragraph(
                    "<b>FACTUUR</b>",
                    ParagraphStyle(
                        "InvoiceHeader",
                        parent=right,
                        fontName="Helvetica-Bold",
                        fontSize=18,
                    ),
                ),
            ]
        ],
        colWidths=[280, 190],
    )

    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    story.append(header)
    story.append(
        Table(
            [[""]],
            colWidths=[470],
            rowHeights=[1],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111111")),
                ]
            ),
        )
    )
    story.append(Spacer(1, 20))

    # ---------------------------------------------------------
    # FACTUURGEGEVENS
    # ---------------------------------------------------------

    invoice_date = datetime.now(timezone.utc).strftime("%d-%m-%Y")

    invoice_info = [
        [
            Paragraph(
                f"""
                <b>Van</b><br/>
                {BUSINESS_NAME}<br/>
                {BUSINESS_ADDRESS}<br/>
                {BUSINESS_POSTAL_CODE} {BUSINESS_CITY}<br/>
                {BUSINESS_COUNTRY}<br/><br/>
                KVK: {KVK_NUMBER}<br/>
                BTW-id: {VAT_NUMBER}
                """,
                normal,
            ),
            Paragraph(
                f"""
                <b>Factuurgegevens</b><br/>
                Factuurnummer: {order.invoice_number or "Wordt aangemaakt"}<br/>
                Factuurdatum: {invoice_date}<br/>
                Ordernummer: {order.order_number}
                """,
                normal,
            ),
        ]
    ]

    info_table = Table(
        invoice_info,
        colWidths=[280, 190],
    )

    info_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    story.append(info_table)
    story.append(Spacer(1, 30))

    # ---------------------------------------------------------
    # KLANT
    # ---------------------------------------------------------

    customer = f"""
    <b>Factuur aan</b><br/>
    {order.first_name} {order.last_name}<br/>
    {order.street} {order.house_number}<br/>
    {order.postal_code} {order.city}<br/>
    {order.country}<br/>
    {order.email}
    """

    story.append(Paragraph(customer, normal))
    story.append(Spacer(1, 25))

    # ---------------------------------------------------------
    # PRODUCTREGELS
    # ---------------------------------------------------------

    rows = [
        [
            Paragraph("<b>Product</b>", normal),
            Paragraph("<b>Aantal</b>", right),
            Paragraph("<b>Prijs</b>", right),
            Paragraph("<b>Totaal</b>", right),
        ]
    ]

    for item in order_items:
        rows.append(
            [
                Paragraph(item.product_title, normal),
                Paragraph(str(item.quantity), right),
                Paragraph(f"€ {item.unit_price:.2f}", right),
                Paragraph(f"€ {item.line_total:.2f}", right),
            ]
        )

        # Productopties
        if item.options:
            for option in item.options:
                option_name = option.get("name", "")
                option_price = float(option.get("price", 0))

                rows.append(
                    [
                        Paragraph(
                            f"&nbsp;&nbsp;{option_name}",
                            small,
                        ),
                        "",
                        Paragraph(
                            f"€ {option_price:.2f}",
                            right,
                        ),
                        "",
                    ]
                )

    product_table = Table(
        rows,
        colWidths=[250, 60, 80, 80],
        repeatRows=1,
    )

    product_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111111")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#111111")),
                ("LINEBELOW", (0, 1), (-1, -1), 0.5, colors.HexColor("#eeeeee")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    story.append(product_table)
    story.append(Spacer(1, 20))

    # ---------------------------------------------------------
    # TOTALEN
    # ---------------------------------------------------------

    totals = [
        [
            Paragraph("Subtotaal", right),
            Paragraph(f"€ {order.subtotal:.2f}", right),
        ],
        [
            Paragraph("Verzending", right),
            Paragraph(f"€ {order.shipping_cost:.2f}", right),
        ],
        [
            Paragraph("<b>Totaal</b>", right),
            Paragraph(f"<b>€ {order.total_price:.2f}</b>", right),
        ],
    ]

    totals_table = Table(
        totals,
        colWidths=[390, 80],
    )

    totals_table.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 2), (-1, 2), 1, colors.HexColor("#111111")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ]
        )
    )

    story.append(totals_table)
    story.append(Spacer(1, 30))

    story.append(
        Paragraph(
            "Bedankt voor je bestelling bij Refixion.",
            normal,
        )
    )

    story.append(Spacer(1, 15))

    story.append(
        Paragraph(
            "Deze factuur is automatisch gegenereerd.",
            small,
        )
    )

    document.build(story)

    pdf = buffer.getvalue()
    buffer.close()

    return pdf