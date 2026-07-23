from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_session
from shop_models import Product

router = APIRouter(prefix="/shop", tags=["Shop"])


@router.get("/products")
async def get_products(
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(select(Product))
    return result.scalars().all()


@router.post("/products")
async def create_product(
    product: dict,
    db: AsyncSession = Depends(get_session)
):

    new_product = Product(
        id=product.get("id"),
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
        created_at="now"
    )

db.add(new_product)
await db.commit()
await db.refresh(new_product)

    return new_product


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_session)
):

result = await db.execute(
    select(Product).where(Product.id == product_id)
)

product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(404, "Product not found")

    db.delete(product)
    db.commit()

    return {"success": True}