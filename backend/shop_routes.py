from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from shop_models import Product

router = APIRouter(prefix="/shop", tags=["Shop"])


@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.post("/products")
def create_product(product: dict, db: Session = Depends(get_db)):

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
    db.commit()
    db.refresh(new_product)

    return new_product


@router.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(404, "Product not found")

    db.delete(product)
    db.commit()

    return {"success": True}