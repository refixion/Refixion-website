from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_admin
from database import get_session
import random
import string
from shop_models import Product, ProductOption, Order, OrderItem


router = APIRouter(prefix="/api/shop", tags=["Shop"])


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
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Order).order_by(Order.created_at.desc())
    )

    orders = result.scalars().all()

    return [
        {
            "id": order.id,
            "order_number": order.order_number,
            "first_name": order.first_name,
            "last_name": order.last_name,
            "email": order.email,
            "phone": order.phone,
            "total": order.total_price,
            "payment_status": order.payment_status,
            "order_status": order.order_status,
            "created_at": order.created_at,
        }
        for order in orders
    ]

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
