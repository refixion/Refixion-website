import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BatteryMedium, Check, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { Section } from "../components/site/primitives";
import { api } from "../lib/api";

function formatPrice(price) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);
}

export default function ShopDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    setActiveImage(0);
    setSelectedOptions([]);
    api
      .get(`/shop/products/${slug}`)
      .then((r) => setProduct(r.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  const toggleOption = (id) => {
    setSelectedOptions((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  if (notFound) {
    return (
      <Section>
        <div className="text-center py-16">
          <div className="text-[18px] font-medium text-[#111111]">Product niet gevonden.</div>
          <Link to="/shop" className="inline-flex items-center gap-2 mt-4 text-[14px] text-[#666666] hover:text-[#111111]">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Terug naar de shop
          </Link>
        </div>
      </Section>
    );
  }

  if (!product) {
    return (
      <Section>
        <div className="text-center py-16 text-[#666666] text-[14px]">Laden...</div>
      </Section>
    );
  }

  const optionsTotal = (product.options || [])
    .filter((o) => selectedOptions.includes(o.id))
    .reduce((sum, o) => sum + o.price, 0);
  const images = product.images?.length ? product.images : [null];
  const outOfStock = product.stock <= 0;

  return (
    <div className="bg-white">
      <Section>
        <Link to="/shop" className="inline-flex items-center gap-2 text-[14px] text-[#666666] hover:text-[#111111]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Terug naar de shop
        </Link>

        <div className="mt-8 grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] overflow-hidden flex items-center justify-center">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <Smartphone className="h-16 w-16 text-[#CCCCCC]" strokeWidth={1} />
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 rounded-xl overflow-hidden border ${i === activeImage ? "border-[#111111]" : "border-[#EAEAEA]"}`}
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

            <div className="mt-2 text-[13px]">
              {outOfStock ? (
                <span className="text-[#DC2626]">Tijdelijk niet op voorraad</span>
              ) : (
                <span className="text-[#16A34A]">Op voorraad ({product.stock} beschikbaar)</span>
              )}
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

            {/* Checkout/betalen is nog niet gebouwd — tijdelijke contact-CTA i.p.v. een lege "koop"-knop. */}
            <a
              href={`/contact?product=${encodeURIComponent(product.title)}`}
              className={`mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-medium transition-colors ${
                outOfStock
                  ? "bg-[#EAEAEA] text-[#999999] pointer-events-none"
                  : "bg-[#111111] text-white hover:bg-[#333]"
              }`}
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
              {outOfStock ? "Niet beschikbaar" : "Interesse? Neem contact op"}
            </a>
            <p className="mt-2 text-[12px] text-[#999999]">Direct online afrekenen komt binnenkort beschikbaar.</p>
          </div>
        </div>
      </Section>
    </div>
  );
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
