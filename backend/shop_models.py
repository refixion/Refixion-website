import uuid

from sqlalchemy import Boolean, Float, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    brand: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)

    storage: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)

    battery_health: Mapped[int] = mapped_column(Integer, nullable=False)

    condition: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[str] = mapped_column(Text)

    price: Mapped[float] = mapped_column(Float, nullable=False)

    stock: Mapped[int] = mapped_column(Integer, default=1)

    warranty_months: Mapped[int] = mapped_column(Integer, default=12)

    images: Mapped[list] = mapped_column(JSONB)

    featured: Mapped[bool] = mapped_column(Boolean, default=False)

    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[str] = mapped_column(Text)


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.id"),
        nullable=False
    )

    url: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )


class ProductOption(Base):
    __tablename__ = "product_options"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )