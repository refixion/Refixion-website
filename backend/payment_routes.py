import os
import stripe

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from invoice_generator import generate_invoice_pdf
from storage import upload_invoice_pdf

from sqlalchemy import select

from database import AsyncSessionLocal
from shop_models import Product, ProductOption, Order, OrderItem

router = APIRouter(prefix="/payments", tags=["Payments"])

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")




class PaymentItem(BaseModel):
    product_id: str
    quantity: int
    option_ids: list[str] = Field(default_factory=list)

class CheckoutRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str

    street: Optional[str] = ""
    house_number: Optional[str] = ""
    postal_code: Optional[str] = ""
    city: Optional[str] = ""
    country: str = "Nederland"

    shipping_method: str = "shipping"

    terms_accepted: bool

    items: list[PaymentItem]


@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    if not request.terms_accepted:
        raise HTTPException(
            status_code=400,
            detail="Je moet akkoord gaan met de algemene voorwaarden."
        )

    if not stripe.api_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe API key ontbreekt"
        )

    if not request.items:
        raise HTTPException(
            status_code=400,
            detail="Winkelwagen is leeg"
        )

    frontend_url = os.environ.get(
        "FRONTEND_URL",
        "https://refixion.nl"
    ).rstrip("/")

    FREE_SHIPPING_FROM = 80.00
    SHIPPING_COST = 4.95

    try:
        async with AsyncSessionLocal() as session:
            line_items = []
            order_items = []
            subtotal = 0.0

            # Producten + opties ophalen en prijzen server-side bepalen
            for item in request.items:
                if item.quantity < 1:
                    raise HTTPException(
                        status_code=400,
                        detail="Ongeldige hoeveelheid"
                    )

                product = await session.get(Product, item.product_id)

                if not product or not product.enabled:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Product {item.product_id} niet gevonden"
                    )

                if product.stock < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Onvoldoende voorraad voor {product.title}"
                    )

                chosen_options = []

                if item.option_ids:
                    result = await session.execute(
                        select(ProductOption).where(
                            ProductOption.product_id == product.id,
                            ProductOption.id.in_(item.option_ids),
                            ProductOption.enabled.is_(True),
                        )
                    )

                    options = result.scalars().all()

                    if len(options) != len(item.option_ids):
                        raise HTTPException(
                            status_code=400,
                            detail=f"Ongeldige productoptie voor {product.title}"
                        )

                    chosen_options = [
                        {
                            "id": option.id,
                            "name": option.name,
                            "price": float(option.price),
                        }
                        for option in options
                    ]

                options_total = sum(
                    option["price"]
                    for option in chosen_options
                )

                unit_price = float(product.price) + options_total
                line_total = unit_price * item.quantity

                subtotal += line_total

                line_items.append({
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": product.title,
                        },
                        "unit_amount": round(unit_price * 100),
                    },
                    "quantity": item.quantity,
                })

                order_items.append({
                    "product_id": product.id,
                    "product_title": product.title,
                    "unit_price": float(product.price),
                    "quantity": item.quantity,
                    "options": chosen_options,
                    "line_total": line_total,
                })

            # Verzendkosten
            shipping_cost = (
                0.0
                if request.shipping_method == "pickup"
                or subtotal >= FREE_SHIPPING_FROM
                else SHIPPING_COST
            )

            total_price = subtotal + shipping_cost

            if shipping_cost > 0:
                line_items.append({
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": "Verzendkosten",
                        },
                        "unit_amount": round(shipping_cost * 100),
                    },
                    "quantity": 1,
                })

            # Ordernummer genereren
            order_number = (
                "RFX-"
                + datetime.now(timezone.utc).strftime("%Y%m%d")
                + "-"
                + "".join(
                    __import__("random").choices(
                        "0123456789",
                        k=4
                    )
                )
            )

            # Order eerst als pending opslaan
            order = Order(
                order_number=order_number,
                first_name=request.first_name,
                last_name=request.last_name,
                email=request.email,
                phone=request.phone,
                street=request.street or "",
                house_number=request.house_number or "",
                postal_code=request.postal_code or "",
                city=request.city or "",
                country=request.country,
                shipping_method=request.shipping_method,
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                total_price=total_price,
                payment_status="pending",
                order_status="new",
                created_at=datetime.now(timezone.utc).isoformat(),
            )

            session.add(order)
            await session.flush()

            # Orderregels opslaan
            for item_data in order_items:
                session.add(
                    OrderItem(
                        order_id=order.id,
                        product_id=item_data["product_id"],
                        product_title=item_data["product_title"],
                        unit_price=item_data["unit_price"],
                        quantity=item_data["quantity"],
                        options=item_data["options"],
                        line_total=item_data["line_total"],
                    )
                )

            # Voorraad reserveren
            for item in request.items:
                product = await session.get(Product, item.product_id)
                product.stock -= item.quantity

            await session.flush()

            # Stripe Checkout aanmaken
            checkout_session = stripe.checkout.Session.create(
                mode="payment",

                payment_method_types=[
                    "ideal",
                    "card",
                ],

                customer_email=request.email,

                line_items=line_items,

                billing_address_collection="required",

                phone_number_collection={
                    "enabled": True,
                },

                metadata={
                    "order_id": order.id,
                    "order_number": order.order_number,
                },

                success_url=(
                    f"{frontend_url}/shop/betaling-gelukt"
                    "?session_id={CHECKOUT_SESSION_ID}"
                ),

                cancel_url=f"{frontend_url}/checkout",
            )

            # Stripe-session aan order koppelen
            order.stripe_session_id = checkout_session.id

            await session.commit()

            return {
                "url": checkout_session.url,
                "sessionId": checkout_session.id,
                "orderNumber": order.order_number,
            }

    except HTTPException:
        raise

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Stripe fout: {str(e)}"
        )

    except Exception as e:
        print("Stripe checkout error:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Kon Stripe checkout niet starten"
        )


# -------------------------------------------------------------
# Oude endpoint behouden voor compatibiliteit
# -------------------------------------------------------------
#
# Als ergens anders in je frontend nog /payments/create wordt
# aangeroepen, blijft die endpoint bestaan.
#

class PaymentRequest(BaseModel):
    amount: int


@router.post("/create")
async def create_payment(request: PaymentRequest):

    if not stripe.api_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe API key ontbreekt"
        )

    if request.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Bedrag moet groter zijn dan 0"
        )

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency="eur",
            payment_method_types=["ideal"],
        )

        return {
            "clientSecret": payment_intent.client_secret
        }

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Stripe fout: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Kon betaling niet starten"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()

    endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    if not endpoint_secret:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_WEBHOOK_SECRET ontbreekt",
        )

    signature = request.headers.get("stripe-signature")

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Stripe signature ontbreekt",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            endpoint_secret,
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Ongeldige webhook payload",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=400,
            detail="Ongeldige Stripe webhook signature",
        )

    if event["type"] == "checkout.session.completed":
        checkout_session = event["data"]["object"]

        payment_status = checkout_session.get("payment_status")

        if payment_status == "paid":
            order_id = checkout_session.get("metadata", {}).get("order_id")

            if order_id:
                async with AsyncSessionLocal() as session:
                    order = await session.get(Order, order_id)

                    if order:
                        order.payment_status = "paid"
                        order.stripe_session_id = checkout_session["id"]
                        order.paid_at = datetime.now(timezone.utc).isoformat()

                        # Factuurnummer maken
                        if not order.invoice_number:
                            order.invoice_number = (
                                "RFX-"
                                + datetime.now(timezone.utc).strftime("%Y%m%d")
                                + "-"
                                + "".join(
                                    __import__("random").choices(
                                        "0123456789",
                                        k=4,
                                    )
                                )
                            )

                        # Orderregels ophalen
                        result = await session.execute(
                            select(OrderItem).where(
                                OrderItem.order_id == order.id
                            )
                        )
                        order_items = result.scalars().all()

                        # Factuur-PDF genereren
                        pdf_bytes = generate_invoice_pdf(
                            order,
                            order_items,
                        )

                        # PDF naar Supabase Storage uploaden
                        filename = f"{order.invoice_number}.pdf"

                        invoice_url = await upload_invoice_pdf(
                            pdf_bytes,
                            filename,
                        )

                        order.invoice_url = invoice_url
                        order.invoice_created_at = datetime.now(timezone.utc).isoformat()

                        await session.commit()

    return {"received": True}