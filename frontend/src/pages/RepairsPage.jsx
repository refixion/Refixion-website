import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, Star } from "lucide-react";
import { SiApple, SiSamsung } from "react-icons/si";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { api } from "../lib/api";

const BRAND_ICONS = { apple: SiApple, samsung: SiSamsung };

export default function RepairsPage() {
  const [brands, setBrands] = useState([]);
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [params, setParams] = useSearchParams();
  const brandSlug = params.get("brand");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/brands").then((r) => setBrands(r.data));
  }, []);

  useEffect(() => {
    const brand = brands.find((b) => b.slug === brandSlug);
    if (!brand) { setDevices([]); return; }
    api.get(`/devices?brand_id=${brand.id}${search ? `&q=${encodeURIComponent(search)}` : ""}`).then((r) => setDevices(r.data));
  }, [brands, brandSlug, search]);

  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Reparaties</SectionEyebrow>
          <SectionHeading>Kies je merk en model.</SectionHeading>
        </FadeUp>

        {!brandSlug && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {brands.map((b, i) => {
              const Icon = BRAND_ICONS[b.slug];
              return (
                <FadeUp key={b.id} delay={i * 0.04}>
                  <button
                    data-testid={`repairs-brand-${b.slug}`}
                    onClick={() => setParams({ brand: b.slug })}
                    className="w-full text-left"
                  >
                    <motion.div whileHover={{ y: -4 }} className="rounded-2xl bg-white border border-[#EAEAEA] p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
                      {Icon && <Icon className="h-8 w-8 text-[#111111]" />}
                      <div className="mt-6 text-[18px] font-medium">{b.name}</div>
                    </motion.div>
                  </button>
                </FadeUp>
              );
            })}
          </div>
        )}

        {brandSlug && (
          <>
            <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
              <button data-testid="repairs-back-brands" onClick={() => setParams({})} className="text-[14px] text-[#666666] hover:text-[#111111]">← Alle merken</button>
              <div className="relative">
                <Search className="h-4 w-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                <input
                  data-testid="repairs-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek toestel..."
                  className="pl-10 pr-4 py-2.5 rounded-full border border-[#EAEAEA] text-[14px] w-64 focus:border-[#111111] outline-none bg-white"
                />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {devices.map((d, i) => (
                <FadeUp key={d.id} delay={Math.min(i * 0.02, 0.15)}>
                  <button
                    data-testid={`device-card-${d.id}`}
                    onClick={() => navigate(`/booking?brand=${brandSlug}&device=${d.id}`)}
                    className="w-full text-left rounded-2xl bg-white border border-[#EAEAEA] p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow"
                  >
                    <div className="text-[15px] font-medium text-[#111111]">{d.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-[#666666]">
                      {d.popular && <span className="inline-flex items-center gap-1 text-[#111111]"><Star className="h-3 w-3 fill-[#111111]" strokeWidth={0} />Populair</span>}
                      <span>Bekijk reparaties</span>
                    </div>
                  </button>
                </FadeUp>
              ))}
              {devices.length === 0 && <div className="text-[14px] text-[#666666] col-span-4">Geen toestellen gevonden.</div>}
            </div>
          </>
        )}
      </Section>
    </div>
  );
}
