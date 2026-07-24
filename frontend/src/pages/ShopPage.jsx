import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BatteryMedium, ShieldCheck, Smartphone, Star } from "lucide-react";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { api } from "../lib/api";

function formatPrice(price) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);
}

function ProductCard({ p }) {
  const cover = p.images?.[0];
  return (
    <Link
      to={`/shop/${p.slug}`}
      data-testid={`shop-product-${p.slug}`}
      className="group rounded-2xl border border-[#EAEAEA] bg-white overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
    >
      <div className="aspect-square bg-[#FAFAFA] flex items-center justify-center overflow-hidden relative">
        {p.featured && (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#111111] text-white px-3 py-1 text-[11px] font-medium">
            <Star className="h-3 w-3" strokeWidth={1.5} /> Uitgelicht
          </span>
        )}
        {cover ? (
          <img
            src={cover}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Smartphone className="h-12 w-12 text-[#CCCCCC]" strokeWidth={1} />
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <div className="text-[15px] font-semibold text-[#111111] leading-tight">{p.title}</div>
          <div className="text-[13px] text-[#666666] mt-0.5">{p.condition}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px] text-[#666666]">
          <span className="rounded-full bg-[#FAFAFA] border border-[#EAEAEA] px-2.5 py-1 inline-flex items-center gap-1">
            <BatteryMedium className="h-3.5 w-3.5" strokeWidth={1.5} /> {p.battery_health}%
          </span>
          <span className="rounded-full bg-[#FAFAFA] border border-[#EAEAEA] px-2.5 py-1">{p.storage}</span>
          <span className="rounded-full bg-[#FAFAFA] border border-[#EAEAEA] px-2.5 py-1">{p.color}</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="text-[20px] font-semibold text-[#111111]">{formatPrice(p.price)}</div>
            <div className="text-[12px] text-[#666666] inline-flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> {p.warranty_months} mnd garantie
            </div>
          </div>
          <span className="rounded-full border border-[#EAEAEA] px-4 py-2 text-[13px] font-medium group-hover:bg-[#111111] group-hover:text-white group-hover:border-[#111111] transition-colors">
            Bekijk product
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    api.get("/shop/products").then((r) => setProducts(r.data));
  }, []);

  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Shop</SectionEyebrow>
          <SectionHeading>Refurbished toestellen.</SectionHeading>
          <p className="mt-4 text-[16px] text-[#666666] max-w-xl">
            Getest, gereinigd en met garantie. Elk toestel is gecontroleerd op batterijconditie en werking.
          </p>
        </FadeUp>

        {products === null && (
          <div className="mt-16 text-center text-[#666666] text-[14px]">Producten laden...</div>
        )}

        {products && products.length === 0 && (
          <div className="mt-16 text-center text-[#666666] text-[14px]">Er zijn op dit moment geen producten beschikbaar.</div>
        )}

        {products && products.length > 0 && (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
