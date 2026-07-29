import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, BatteryMedium, Check, ShoppingCart, Zap, ShieldCheck, Smartphone,
} from "lucide-react";
import { Section } from "../components/site/primitives";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api";
import { addToCart } from "../lib/cart";
import NotFoundPage from "./NotFoundPage";

const LOW_STOCK_THRESHOLD = 3;
const SWIPE_THRESHOLD_PX = 50;

function formatPrice(price) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);
}

function useProductSeo(product) {
  useEffect(() => {
    if (!product) return;
    const prevTitle = document.title;
    document.title = `${product.title} -- Refixion`;

    let meta = document.head.querySelector('meta[name="description"]');
    const hadMeta = !!meta;
    const prevContent = meta?.getAttribute("content");
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const desc = product.description
      ? product.description.slice(0, 155)
      : `${product.title} -- ${product.condition}, ${product.storage}, ${product.battery_health}% batterij. ${product.warranty_months} maanden garantie.`;
    meta.setAttribute("content", desc);

    return () => {
      document.title = prevTitle;
      if (meta && hadMeta && prevContent != null) meta.setAttribute("content", prevContent);
    };
  }, [product]);
}

function StockBadge({ stock }) {
  if (stock <= 0) {
    return <span className="inline-flex items-center gap-1.5 text-[13px] text-[#DC2626]"><span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />Uitverkocht</span>;
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return <span className="inline-flex items-center gap-1.5 text-[13px] text-[#D97706]"><span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />Nog maar {stock} beschikbaar</span>;
  }
  return <span className="inline-flex items-center gap-1.5 text-[13px] text-[#16A34A]"><span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />Op voorraad</span>;
}

function Spec({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-[#666666]">{label}</div>
      <div className="text-[14px] font-medium text-[#111111] mt-0.5 inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />} {value}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Section>
      <Skeleton className="h-5 w-32" />
      <div className="mt-8 grid lg:grid-cols-2 gap-12">
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="mt-3 flex gap-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-16 rounded-xl" />)}
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="mt-4 h-9 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-6 h-10 w-40" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
          <Skeleton className="mt-6 h-24 w-full" />
          <Skeleton className="mt-8 h-14 w-full rounded-full" />
        </div>
      </div>
    </Section>
  );
}

function RelatedProducts({ currentSlug, brand }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get("/shop/products").then((r) => {
      const all = (r.data || []).filter((p) => p.slug !== currentSlug);
      const sameBrand = all.filter((p) => p.brand === brand);
      const rest = all.filter((p) => p.brand !== brand);
      setItems([...sameBrand, ...rest].slice(0, 4));
    }).catch(() => setItems([]));
  }, [currentSlug, brand]);

  if (!items || items.length === 0) return null;

  return (
    <Section className="border-t border-[#EAEAEA]">
      <div className="text-[13px] uppercase tracking-wider text-[#666666] mb-6">Gerelateerde producten</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/shop/${p.slug}`}
            data-testid={`related-product-${p.slug}`}
            className="group block rounded-2xl border border-[#EAEAEA] bg-white overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow"
          >
            <div className="aspect-square bg-[#FAFAFA] overflow-hidden flex items-center justify-center">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <Smartphone className="h-8 w-8 text-[#CCCCCC]" strokeWidth={1} />
              )}
            </div>
            <div className="p-4">
              <div className="text-[14px] font-medium text-[#111111] truncate">{p.title}</div>
              <div className="mt-1 text-[15px] font-semibold text-[#111111]">{formatPrice(p.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export default function ShopDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const touchStartX = useRef(null);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    setActiveImage(0);
    setSelectedOptions([]);
    setQuantity(1);
    api
      .get(`/shop/products/${slug}`)
      .then((r) => setProduct(r.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  useProductSeo(product);

  const toggleOption = (id) => {
    setSelectedOptions((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  if (notFound) return <NotFoundPage />;
  if (!product) return <DetailSkeleton />;

  const images = product.images?.length ? product.images : [null];
  const chosenOptions = (product.options || []).filter((o) => selectedOptions.includes(o.id));
  const optionsTotal = chosenOptions.reduce((sum, o) => sum + o.price, 0);
  const outOfStock = product.stock <= 0;

  const goToImage = (dir) => {
    setActiveImage((i) => (i + dir + images.length) % images.length);
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX && images.length > 1) {
      goToImage(dx < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  };

  const buildCartItem = () => ({
    productId: product.id,
    slug: product.slug,
    title: product.title,
    image: images[0] || null,
    unitPrice: product.price,
    optionIds: selectedOptions,
    optionsLabel: chosenOptions.map((o) => o.name).join(", "),
    optionsPrice: optionsTotal,
    quantity,
  });

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(buildCartItem());
    toast.success(`${product.title} toegevoegd aan winkelwagen`);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addToCart(buildCartItem());
    navigate("/cart");
  };

  return (
    <div className="bg-white">
      <Section>
        <Link to="/shop" className="inline-flex items-center gap-2 text-[14px] text-[#666666] hover:text-[#111111]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Terug naar de shop
        </Link>

        <div className="mt-8 grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div
              className="relative aspect-square rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] overflow-hidden flex items-center justify-center select-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              data-testid="product-image-gallery"
            >
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <Smartphone className="h-16 w-16 text-[#CCCCCC]" strokeWidth={1} />
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => goToImage(-1)}
                    aria-label="Vorige afbeelding"
                    className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-[#EAEAEA] items-center justify-center hover:bg-white"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => goToImage(1)}
                    aria-label="Volgende afbeelding"
                    className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-[#EAEAEA] items-center justify-center hover:bg-white"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === activeImage ? "bg-[#111111]" : "bg-white/80 border border-[#EAEAEA]"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    data-testid={`product-thumb-${i}`}
                    className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border ${i === activeImage ? "border-[#111111]" : "border-[#EAEAEA]"}`}
                  >
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.featured && (
              <span className="inline-block rounded-full bg-[#111111] text-white px-3 py-1 text-[11px] font-medium mb-3">
                Uitgelicht
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">{product.title}</h1>
            <div className="text-[14px] text-[#666666] mt-1">{product.brand} · {product.model}</div>

            <div className="mt-6 flex items-baseline gap-3">
              <div className="text-[32px] font-semibold text-[#111111]">
                {formatPrice(product.price + optionsTotal)}
              </div>
              {optionsTotal > 0 && (
                <div className="text-[13px] text-[#666666]">incl. {formatPrice(optionsTotal)} aan opties</div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Spec label="Conditie" value={product.condition} />
              <Spec label="Opslag" value={product.storage} />
              <Spec label="Kleur" value={product.color} />
              <Spec label="Batterij" value={`${product.battery_health}%`} icon={BatteryMedium} />
            </div>

            <div className="mt-4 flex items-center gap-2 text-[13px] text-[#666666]">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> {product.warranty_months} maanden garantie
            </div>

            <div className="mt-2">
              <StockBadge stock={product.stock} />
            </div>

            {product.description && (
              <p className="mt-6 text-[15px] text-[#666666] leading-relaxed whitespace-pre-line">{product.description}</p>
            )}

            {product.options?.length > 0 && (
              <div className="mt-8">
                <div className="text-[13px] font-medium text-[#111111] mb-3">Extra opties</div>
                <div className="space-y-2">
                  {product.options.map((o) => (
                    <label
                      key={o.id}
                      className="flex items-center justify-between rounded-xl border border-[#EAEAEA] px-4 py-3 cursor-pointer hover:bg-[#FAFAFA]"
                    >
                      <span className="inline-flex items-center gap-2 text-[14px] text-[#111111]">
                        <span
                          className={`h-4 w-4 rounded border flex items-center justify-center ${selectedOptions.includes(o.id) ? "bg-[#111111] border-[#111111]" : "border-[#CCCCCC]"}`}
                        >
                          {selectedOptions.includes(o.id) && <Check className="h-3 w-3 text-white" strokeWidth={2} />}
                        </span>
                        {o.name}
                      </span>
                      <span className="text-[14px] text-[#666666]">+{formatPrice(o.price)}</span>
                      <input type="checkbox" className="hidden" checked={selectedOptions.includes(o.id)} onChange={() => toggleOption(o.id)} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Aantal */}
            <div className="mt-8 flex items-center gap-3">
              <span className="text-[13px] text-[#666666]">Aantal</span>
              <div className="inline-flex items-center rounded-full border border-[#EAEAEA]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-9 w-9 flex items-center justify-center text-[16px] text-[#111111] hover:bg-[#FAFAFA] rounded-l-full"
                  aria-label="Minder"
                >
                  −
                </button>
                <span className="w-8 text-center text-[14px] text-[#111111]" data-testid="product-quantity">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  className="h-9 w-9 flex items-center justify-center text-[16px] text-[#111111] hover:bg-[#FAFAFA] rounded-r-full"
                  aria-label="Meer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                data-testid="add-to-cart-btn"
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-medium transition-colors ${
                  outOfStock ? "bg-[#EAEAEA] text-[#999999] pointer-events-none" : "bg-white text-[#111111] border border-[#111111] hover:bg-[#FAFAFA]"
                }`}
              >
                <ShoppingCart className="h-4 w-4" strokeWidth={1.5} /> Toevoegen aan winkelwagen
              </button>
              <button
                onClick={handleBuyNow}
                disabled={outOfStock}
                data-testid="buy-now-btn"
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-medium transition-colors ${
                  outOfStock ? "bg-[#EAEAEA] text-[#999999] pointer-events-none" : "bg-[#111111] text-white hover:bg-[#333]"
                }`}
              >
                <Zap className="h-4 w-4" strokeWidth={1.5} /> {outOfStock ? "Niet beschikbaar" : "Direct bestellen"}
              </button>
            </div>
          </div>
        </div>
      </Section>

      <RelatedProducts currentSlug={product.slug} brand={product.brand} />
    </div>
  );
}
