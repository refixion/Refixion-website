import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { SiApple, SiSamsung } from "react-icons/si";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";

const BRAND_ICONS = { apple: SiApple, samsung: SiSamsung };

export default function PricingPage() {
  const [brands, setBrands] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [activeBrand, setActiveBrand] = useState("apple");

  useEffect(() => {
    api.get("/brands").then((r) => setBrands(r.data));
    api.get("/repairs").then((r) => setRepairs(r.data));
  }, []);

  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Transparante prijzen</SectionEyebrow>
          <SectionHeading>De prijs die je ziet is de prijs die je betaalt.</SectionHeading>
          <p className="mt-6 max-w-2xl text-lg text-[#666666] leading-relaxed">Geen verrassingen. Geen kleine lettertjes. Alle prijzen zijn inclusief BTW, arbeid en garantie.</p>
        </FadeUp>

        <div className="mt-10 flex flex-wrap gap-2">
          {brands.map((b) => {
            const Icon = BRAND_ICONS[b.slug];
            return (
              <button
                key={b.id}
                data-testid={`pricing-brand-${b.slug}`}
                onClick={() => setActiveBrand(b.slug)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] transition-colors ${activeBrand === b.slug ? "border-[#111111] bg-[#111111] text-white" : "border-[#EAEAEA] bg-white text-[#111111] hover:bg-[#FAFAFA]"}`}
              >
                {Icon && <Icon className="h-4 w-4" />} {b.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {repairs.map((r) => (
            <FadeUp key={r.id}>
              <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6">
                <div className="flex items-start justify-between">
                  <div className="text-[16px] font-medium text-[#111111]">{r.name}</div>
                  <div className="text-[18px] font-semibold text-[#111111]">vanaf €{r.price_eur}</div>
                </div>
                <div className="mt-2 text-[13px] text-[#666666]">{r.description}</div>
                <div className="mt-4 text-[12px] text-[#666666]">~ {r.duration_minutes} min · {r.warranty}</div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="mt-14 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-[20px] font-medium text-[#111111]">Model niet in de lijst?</div>
              <div className="text-[14px] text-[#666666] mt-2">Neem contact op voor een precieze prijsopgave. Meestal binnen een paar minuten.</div>
            </div>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium">
              Neem contact op <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </FadeUp>
      </Section>
    </div>
  );
}
