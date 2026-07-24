from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_admin
from database import get_session
from shop_models import Product, ProductOption

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
