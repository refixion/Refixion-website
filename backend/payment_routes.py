import os
import stripe

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional


router = APIRouter(prefix="/payments", tags=["Payments"])

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")


from pydantic import BaseModel, Field

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

    items: list[PaymentItem]


@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    """
    Maakt een Stripe Checkout Session aan.

    De klant wordt doorgestuurd naar de door Stripe gehoste
    betaalpagina.

    Stripe rekent de daadwerkelijke productprijzen uit op basis
    van de gegevens die we hier doorgeven.
    """

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

    # URLs voor terugsturen na betaling.
    # In development kan FRONTEND_URL in .env staan.
    frontend_url = os.environ.get(
        "FRONTEND_URL",
        "https://refixion.nl"
    ).rstrip("/")

    try:
        # ---------------------------------------------------------
        # Productprijzen ophalen uit Stripe
        # ---------------------------------------------------------
        #
        # BELANGRIJK:
        # Deze versie verwacht dat je producten in Stripe als
        # Price-objecten hebt opgeslagen en dat je frontend/backend
        # de Stripe Price ID kent.
        #
        # Omdat je huidige winkelwagen alleen product_id gebruikt,
        # gebruiken we hieronder tijdelijk de database om de
        # producten/prijzen op te halen.
        #
        # Als jouw shop_routes.py al een product-prijsstructuur heeft,
        # kunnen we deze functie daarop aansluiten.
        # ---------------------------------------------------------

        from database import AsyncSessionLocal
        from sqlalchemy import text

        line_items = []

        async with AsyncSessionLocal() as session:

            for item in request.items:

                if item.quantity < 1:
                    raise HTTPException(
                        status_code=400,
                        detail="Ongeldige hoeveelheid"
                    )

                result = await session.execute(
                    text(
                        """
                        SELECT
                            id,
                            title,
                            price
                        FROM products
                        WHERE id = :product_id
                        """
                    ),
                    {
                        "product_id": item.product_id
                    }
                )

                product = result.mappings().first()

                if not product:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Product {item.product_id} niet gevonden"
                    )

                price = float(product["price"])

                if price < 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ongeldige prijs voor product {product['title']}"
                    )

                # Stripe verwacht bedragen in centen.
                unit_amount = round(price * 100)

                line_items.append(
                    {
                        "price_data": {
                            "currency": "eur",
                            "product_data": {
                                "name": product["title"],
                            },
                            "unit_amount": unit_amount,
                        },
                        "quantity": item.quantity,
                    }
                )

        # ---------------------------------------------------------
        # Verzendkosten
        # ---------------------------------------------------------

        subtotal = sum(
            item["price_data"]["unit_amount"] * item["quantity"]
            for item in line_items
        )

        shipping_amount = 0

        if request.shipping_method != "pickup" and subtotal < 5000:
            shipping_amount = 495

        if shipping_amount > 0:
            line_items.append(
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": "Verzendkosten",
                        },
                        "unit_amount": shipping_amount,
                    },
                    "quantity": 1,
                }
            )

        # ---------------------------------------------------------
        # Stripe Checkout Session
        # ---------------------------------------------------------

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
                "first_name": request.first_name,
                "last_name": request.last_name,
                "phone": request.phone,
                "street": request.street or "",
                "house_number": request.house_number or "",
                "postal_code": request.postal_code or "",
                "city": request.city or "",
                "country": request.country,
                "shipping_method": request.shipping_method,
            },

            success_url=(
                f"{frontend_url}/shop/betaling-gelukt"
                "?session_id={CHECKOUT_SESSION_ID}"
            ),

            cancel_url=(
                f"{frontend_url}/checkout"
            ),
        )

        return {
            "url": checkout_session.url,
            "sessionId": checkout_session.id,
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
