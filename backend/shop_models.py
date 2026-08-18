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

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Mensvriendelijk nummer voor in de admin en klantcommunicatie — de UUID
    # hierboven blijft de echte primary/foreign key.
    order_number: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)

    street: Mapped[str] = mapped_column(String, nullable=False)
    house_number: Mapped[str] = mapped_column(String, nullable=False)
    postal_code: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False, default="Nederland")

    shipping_method: Mapped[str] = mapped_column(String, nullable=False, default="shipping")  # "pickup" | "shipping"

    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    shipping_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    # Altijd (her)berekend server-side uit de order_items — een door de klant
    # meegestuurd bedrag wordt nooit vertrouwd.
    total_price: Mapped[float] = mapped_column(Float, nullable=False)

    payment_status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="pending",
    )

    order_status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="new",
    )

    stripe_session_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        unique=True,
    )

    paid_at: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    invoice_number: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        unique=True,
    )

    invoice_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    invoice_created_at: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    sendcloud_parcel_id: Mapped[str | None] = mapped_column(
    String,
    nullable=True,
    )

    sendcloud_tracking_number: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    sendcloud_tracking_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sendcloud_label_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sendcloud_shipping_option: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    sendcloud_label_created_at: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    product_id: Mapped[str] = mapped_column(String, nullable=False)
    # Snapshot van titel/prijs op bestelmoment — als een product later hernoemd,
    # geprijsd of verwijderd wordt, blijft de historische bestelling correct.
    product_title: Mapped[str] = mapped_column(String, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Gekozen product_options op bestelmoment, als [{"id","name","price"}, ...]
    options: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    line_total: Mapped[float] = mapped_column(Float, nullable=False)
