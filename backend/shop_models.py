import uuid

from sqlalchemy import Boolean, Float, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    brand: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)

    storage: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)

    battery_health: Mapped[int] = mapped_column(Integer, nullable=False)

    condition: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[str] = mapped_column(Text, default="")

    price: Mapped[float] = mapped_column(Float, nullable=False)

    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    warranty_months: Mapped[int] = mapped_column(Integer, nullable=False, default=12)

    # Bron van waarheid voor foto's. product_images (hieronder) is nog niet
    # bekabeld in shop_routes.py — bewaard voor later echte file-uploads.
    images: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    featured: Mapped[bool] = mapped_column(Boolean, default=False)

    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[str] = mapped_column(Text, nullable=False)


class ProductImage(Base):
    """Nog niet gebruikt door shop_routes.py — zie comment bij Product.images."""
    __tablename__ = "product_images"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)


class ProductOption(Base):
    __tablename__ = "product_options"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
