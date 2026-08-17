from datetime import datetime, timezone
import os
import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_admin
from database import get_session
import random
import string
from shop_models import Product, ProductOption, Order, OrderItem


router = APIRouter(prefix="/api/shop", tags=["Shop"])
logger = logging.getLogger(__name__)

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def product_to_dict(p: Product) -> dict:
    return {
        "id": p.id, "title": p.title, "slug": p.slug, "brand": p.brand, "model": p.model,
        "storage": p.storage, "color": p.color, "battery_health": p.battery_health,
        "condition": p.condition, "description": p.description, "price": p.price,
        "stock": p.stock, "warranty_months": p.warranty_months, "images": p.images,
        "featured": p.featured, "enabled": p.enabled, "created_at": p.created_at,
    }


def option_to_dict(o: ProductOption) -> dict:
    return {"id": o.id, "name": o.name, "price": o.price, "enabled": o.enabled}


@router.get("/test")
async def test():
    return {"working": True}


# ------- Publiek -------
@router.get("/products")
async def get_products(session: AsyncSession = Depends(get_session)):
    """Winkelweergave — alleen actieve producten."""
    rows = (await session.execute(
        select(Product).where(Product.enabled.is_(True)).order_by(Product.created_at.desc())
    )).scalars().all()
    return [product_to_dict(p) for p in rows]


@router.get("/products/{slug}")
async def get_product(slug: str, session: AsyncSession = Depends(get_session)):
    """Publieke productdetail, inclusief opties."""
    product = (await session.execute(
        select(Product).where(Product.slug == slug, Product.enabled.is_(True))
    )).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    options = (await session.execute(
        select(ProductOption).where(ProductOption.product_id == product.id, ProductOption.enabled.is_(True))
    )).scalars().all()
    doc = product_to_dict(product)
    doc["options"] = [option_to_dict(o) for o in options]
    return doc


# ------- Admin -------
@router.get("/admin/products")
async def admin_list_products(_: dict = Depends(get_current_admin), session: AsyncSession = Depends(get_session)):
    """Admin-overzicht — toont ook disabled producten, i.t.t. het publieke endpoint."""
    rows = (await session.execute(select(Product).order_by(Product.created_at.desc()))).scalars().all()
    return [product_to_dict(p) for p in rows]

@router.get("/admin/orders")
async def get_admin_orders(
    q: str = "",
    status: str = "",
    _: dict = Depends(get_current_admin),
    page: int = 1,
    limit: int = 10,
    session: AsyncSession = Depends(get_session),
):

    query = select(Order)

    if q:
        query = query.where(
            or_(
                Order.order_number.ilike(f"%{q}%"),
                Order.email.ilike(f"%{q}%")
            )
        )

    if status:
        query = query.where(Order.order_status == status)

    query = query.order_by(Order.created_at.desc())

    # totaal aantal resultaten
    count_result = await session.execute(query)
    total = len(count_result.scalars().all())

    # pagination
    query = query.offset((page - 1) * limit).limit(limit)

    result = await session.execute(query)

    orders = result.scalars().all()

    return {
        "orders": [
            {
                "id": order.id,
                "order_number": order.order_number,
                "first_name": order.first_name,
                "last_name": order.last_name,
                "email": order.email,
                "total_price": order.total_price,
                "order_status": order.order_status,
                "created_at": order.created_at,
            }
            for order in orders
        ],
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }

@router.get("/admin/orders/{order_id}")
async def get_admin_order(
    order_id: str,
    _: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    order = await session.get(Order, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order niet gevonden")

    items = (
        await session.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
    ).scalars().all()

    return order_to_dict(order, items)

@router.post("/admin/orders/{order_id}/shipping/label")
async def create_shipping_label(
    order_id: str,
    _: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    """
    Maakt een Sendcloud-label voor een betaalde webshoporder.
    """

    # 1. Order ophalen
    order = await session.get(Order, order_id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order niet gevonden",
        )

    # 2. Alleen betaalde orders mogen een label krijgen
    if order.payment_status != "paid":
        raise HTTPException(
            status_code=400,
            detail="Order is nog niet betaald",
        )

    # 3. Alleen verzendorders
    if order.shipping_method != "shipping":
        raise HTTPException(
            status_code=400,
            detail="Deze order gebruikt geen verzending",
        )

    # 4. Voorkom dubbele labels
    if order.sendcloud_label_url:
        return {
            "success": True,
            "already_exists": True,
            "message": "Voor deze order bestaat al een verzendlabel.",
            "parcel_id": order.sendcloud_parcel_id,
            "tracking_number": order.sendcloud_tracking_number,
            "tracking_url": order.sendcloud_tracking_url,
            "label_url": order.sendcloud_label_url,
        }

    # 5. Sendcloud keys ophalen
    public_key = os.environ.get("SENDCLOUD_PUBLIC_KEY")
    secret_key = os.environ.get("SENDCLOUD_SECRET_KEY")

    if not public_key or not secret_key:
        raise HTTPException(
            status_code=500,
            detail="Sendcloud API keys ontbreken",
        )

    # 6. Adresgegevens voorbereiden
    country = order.country or "Nederland"

    country_code = "NL" if country.lower() in {
        "nl",
        "nederland",
        "netherlands",
    } else country.upper()

    payload = {
        "label_details": {
            "mime_type": "application/pdf",
            "dpi": 72,
        },
        "from_address": {
            "id": 877819,
        },
        "to_address": {
            "name": f"{order.first_name} {order.last_name}",
            "address_line_1": order.street,
            "house_number": order.house_number,
            "postal_code": order.postal_code,
            "city": order.city,
            "country_code": country_code,
            "phone_number": order.phone,
            "email": order.email,
        },
        "ship_with": {
            "type": "shipping_option_code",
            "properties": {
                "shipping_option_code": "postnl:standard",
            },
        },
        "order_number": order.order_number,
        "total_order_price": {
            "currency": "EUR",
            "value": f"{order.total_price:.2f}",
        },
        "parcels": [
            {
                "weight": {
                    "value": "0.500",
                    "unit": "kg",
                }
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:

            response = await client.post(
                "https://panel.sendcloud.sc/api/v3/shipments",
                auth=(public_key, secret_key),
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code >= 400:
            return {
                "debug": True,
                "sendcloud_status": response.status_code,
                "sendcloud_response": response.text,
            }

        data = response.json()

    except Exception as e:
        logger.exception("Sendcloud label creation failed")

        return {
            "debug": True,
            "error": str(e),
        }

    # V3 response bevat het shipment-object onder "data"
    shipment = data.get("data") or data

    # Controleer of Sendcloud de shipment daadwerkelijk heeft aangekondigd
    errors = shipment.get("errors") or []

    if errors:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Sendcloud heeft de shipment niet kunnen aankondigen",
                "sendcloud_errors": errors,
                "sendcloud_response": data,
            },
        )

    shipment_id = shipment.get("id")

    parcels = shipment.get("parcels") or []

    if not shipment_id or not parcels:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Sendcloud gaf geen shipment/parceldetails terug",
                "sendcloud_response": data,
            },
        )

    parcel = parcels[0]

    parcel_id = parcel.get("id")

    tracking_number = (
        parcel.get("tracking_number")
        or parcel.get("tracking")
        or ""
    )

    tracking_url = (
        parcel.get("tracking_url")
        or ""
    )

    label_url = (
        parcel.get("label_url")
        or parcel.get("label", {}).get("url", "")
        or ""
    )

    if not parcel_id:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Sendcloud gaf geen parcel ID terug",
                "sendcloud_response": data,
            },
        )

    # 8. Opslaan in database
    order.sendcloud_parcel_id = str(parcel_id)
    order.sendcloud_tracking_number = tracking_number
    order.sendcloud_tracking_url = tracking_url
    order.sendcloud_label_url = label_url
    order.sendcloud_shipping_option = "postnl:standard"
    order.sendcloud_label_created_at = _now_iso()

    order.order_status = "packed"

    await session.commit()

    # 9. Resultaat teruggeven aan admin
    return {
        "success": True,
        "already_exists": False,
        "parcel_id": order.sendcloud_parcel_id,
        "tracking_number": order.sendcloud_tracking_number,
        "tracking_url": order.sendcloud_tracking_url,
        "label_url": order.sendcloud_label_url,
        "shipping_option": order.sendcloud_shipping_option,
    }
@router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: dict,
    _: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    order = await session.get(Order, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order niet gevonden")

    allowed_statuses = [
        "new",
        "processing",
        "waiting_parts",
        "packed",
        "shipped",
        "delivered",
        "cancelled"
    ]

    status = payload.get("status")

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Ongeldige status"
        )

    order.order_status = status

    await session.commit()

    return {
        "success": True,
        "status": order.order_status
    }


@router.post("/products")
async def create_product(
    product: dict,
    _: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    new_product = Product(
        title=product["title"],
        slug=product["slug"],
        brand=product["brand"],
        model=product["model"],
        storage=product["storage"],
        color=product["color"],
        battery_health=product["battery_health"],
        condition=product["condition"],
        description=product.get("description", ""),
        price=product["price"],
        stock=product.get("stock", 1),
        warranty_months=product.get("warranty_months", 12),
        images=product.get("images", []),
        featured=product.get("featured", False),
        enabled=product.get("enabled", True),
        created_at=_now_iso(),
    )
    session.add(new_product)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Slug bestaat al")
    await session.refresh(new_product)

    for opt in product.get("options", []):
        session.add(ProductOption(
            product_id=new_product.id, name=opt["name"], price=opt["price"], enabled=opt.get("enabled", True),
        ))
    if product.get("options"):
        await session.commit()

    return product_to_dict(new_product)


@router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    product: dict,
    _: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    existing = await session.get(Product, product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product niet gevonden")

    allowed = {
        "title", "slug", "brand", "model", "storage", "color", "battery_health",
        "condition", "description", "price", "stock", "warranty_months",
        "images", "featured", "enabled",
    }
    for k, v in product.items():
        if k in allowed:
            setattr(existing, k, v)

    if "options" in product:
        await session.execute(delete(ProductOption).where(ProductOption.product_id == product_id))
        for opt in product["options"]:
            session.add(ProductOption(
                product_id=product_id, name=opt["name"], price=opt["price"], enabled=opt.get("enabled", True),
            ))

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Slug bestaat al")

    return {"ok": True}


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    _: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    existing = await session.get(Product, product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    # Opties expliciet bulk-verwijderen i.p.v. op ORM-cascade steunen — dat laatste
    # triggert een lazy-load tijdens session.delete() en crasht async (MissingGreenlet).
    await session.execute(delete(ProductOption).where(ProductOption.product_id == product_id))
    await session.execute(delete(Product).where(Product.id == product_id))
    await session.commit()

    return {"success": True}

FREE_SHIPPING_FROM = 80
SHIPPING_COST = 4.95


def _generate_order_number() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = "".join(random.choices(string.digits, k=4))
    return f"RFX-{today}-{suffix}"


def order_to_dict(o: Order, items: list[OrderItem]) -> dict:
    return {
        "id": o.id,
        "order_number": o.order_number,
        "first_name": o.first_name,
        "last_name": o.last_name,
        "email": o.email,
        "phone": o.phone,
        "street": o.street,
        "house_number": o.house_number,
        "postal_code": o.postal_code,
        "city": o.city,
        "country": o.country,
        "shipping_method": o.shipping_method,
        "subtotal": o.subtotal,
        "shipping_cost": o.shipping_cost,
        "total_price": o.total_price,
        "shipping": {
            "method": o.shipping_method,
            "sendcloud_parcel_id": o.sendcloud_parcel_id,
            "sendcloud_tracking_number": o.sendcloud_tracking_number,
            "sendcloud_tracking_url": o.sendcloud_tracking_url,
            "sendcloud_label_url": o.sendcloud_label_url,
            "sendcloud_shipping_option": o.sendcloud_shipping_option,
            "sendcloud_label_created_at": o.sendcloud_label_created_at,
        },
        "payment_status": o.payment_status,
        "order_status": o.order_status,
        "created_at": o.created_at,
        "items": [
            {
                "product_id": i.product_id,
                "product_title": i.product_title,
                "unit_price": i.unit_price,
                "quantity": i.quantity,
                "options": i.options,
                "line_total": i.line_total,
            }
            for i in items
        ],
    }


@router.post("/orders")
async def create_order(payload: dict, session: AsyncSession = Depends(get_session)):
    """Plaatst een bestelling. Publiek endpoint — geen admin-auth, dit is de
    checkout van een klant.

    Verwacht:
    {
      "first_name", "last_name", "email", "phone",
      "street", "house_number", "postal_code", "city", "country",
      "shipping_method": "pickup" | "shipping",
      "items": [{"product_id": "...", "quantity": 1, "option_ids": ["..."]}]
    }

    Prijzen en voorraad worden altijd server-side opnieuw bepaald — een door de
    klant meegestuurd bedrag wordt nooit vertrouwd.
    """
    required_customer_fields = [
        "first_name", "last_name", "email", "phone",
        "street", "house_number", "postal_code", "city",
    ]
    missing = [f for f in required_customer_fields if not payload.get(f)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Ontbrekende velden: {', '.join(missing)}")

    items_in = payload.get("items") or []
    if not items_in:
        raise HTTPException(status_code=400, detail="Winkelwagen is leeg")

    order_items: list[OrderItem] = []
    subtotal = 0.0

    for line in items_in:
        product = await session.get(Product, line.get("product_id"))
        if not product or not product.enabled:
            raise HTTPException(status_code=400, detail=f"Product niet beschikbaar: {line.get('product_id')}")

        quantity = int(line.get("quantity", 1))
        if quantity < 1:
            raise HTTPException(status_code=400, detail=f"Ongeldig aantal voor {product.title}")
        if product.stock < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Onvoldoende voorraad voor {product.title} (nog {product.stock} beschikbaar)",
            )

        option_ids = line.get("option_ids") or []
        chosen_options = []
        if option_ids:
            opt_rows = (await session.execute(
                select(ProductOption).where(
                    ProductOption.product_id == product.id,
                    ProductOption.id.in_(option_ids),
                    ProductOption.enabled.is_(True),
                )
            )).scalars().all()
            chosen_options = [{"id": o.id, "name": o.name, "price": o.price} for o in opt_rows]

        options_total = sum(o["price"] for o in chosen_options)
        line_total = (product.price + options_total) * quantity
        subtotal += line_total

        product.stock -= quantity  # voorraad direct reserveren bij het plaatsen van de bestelling

        order_items.append(OrderItem(
            product_id=product.id,
            product_title=product.title,
            unit_price=product.price,
            quantity=quantity,
            options=chosen_options,
            line_total=line_total,
        ))

    shipping_method = payload.get("shipping_method", "shipping")
    shipping_cost = 0.0 if (shipping_method == "pickup" or subtotal >= FREE_SHIPPING_FROM) else SHIPPING_COST
    total_price = subtotal + shipping_cost

    order = Order(
        order_number=_generate_order_number(),
        first_name=payload["first_name"],
        last_name=payload["last_name"],
        email=payload["email"],
        phone=payload["phone"],
        street=payload["street"],
        house_number=payload["house_number"],
        postal_code=payload["postal_code"],
        city=payload["city"],
        country=payload.get("country", "Nederland"),
        shipping_method=shipping_method,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total_price=total_price,
        created_at=_now_iso(),
    )
    session.add(order)
    await session.flush()  # order.id beschikbaar maken voor de order_items hieronder

    for item in order_items:
        item.order_id = order.id
        session.add(item)

    await session.commit()

    return order_to_dict(order, order_items)
