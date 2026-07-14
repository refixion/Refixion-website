import React from "react";
import { Link } from "react-router-dom";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Over Refixion</SectionEyebrow>
          <SectionHeading className="max-w-3xl">Een premium tech-merk. Dat toevallig ook repareert.</SectionHeading>
          <p className="mt-8 max-w-3xl text-lg text-[#666666] leading-relaxed">Refixion is opgericht met één doel: smartphone-reparaties naar het niveau tillen dat je van een premium tech-merk zou verwachten. Geen chaotische balies, geen agressieve upsells, geen twijfelachtige onderdelen. Alleen precisie, transparantie en respect voor jouw tijd.</p>
        </FadeUp>
      </Section>

      <Section className="bg-[#FAFAFA] border-y border-[#EAEAEA]">
        <FadeUp>
          <SectionEyebrow>Waar wij voor staan</SectionEyebrow>
          <SectionHeading>Kernwaarden.</SectionHeading>
        </FadeUp>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { Icon: Sparkles, t: "Premium kwaliteit", d: "Elk onderdeel dat we gebruiken voldoet aan of overtreft de fabrieksspecificaties." },
            { Icon: ShieldCheck, t: "Vertrouwen", d: "Levenslange garantie op schermen. Geen kleine lettertjes." },
            { Icon: Zap, t: "Snelheid", d: "De meeste reparaties zijn binnen 45 minuten klaar terwijl u wacht." },
          ].map((v) => (
            <FadeUp key={v.t}>
              <div className="h-full rounded-2xl bg-white border border-[#EAEAEA] p-8">
                <v.Icon className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                <div className="mt-6 text-[18px] font-medium text-[#111111]">{v.t}</div>
                <div className="mt-2 text-[14px] text-[#666666] leading-relaxed">{v.d}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      <Section>
        <FadeUp>
          <div className="rounded-2xl bg-[#111111] text-white p-10 md:p-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">Laat ons je toestel herstellen.</h3>
              <p className="mt-3 text-white/60">Boek in minder dan een minuut een afspraak.</p>
            </div>
            <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-white text-[#111111] px-6 py-3.5 text-[14px] font-medium hover:bg-white/90">
              Reparatie boeken <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </FadeUp>
      </Section>
    </div>
  );
}
