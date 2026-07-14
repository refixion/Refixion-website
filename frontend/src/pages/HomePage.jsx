import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Zap, Star, ChevronDown, Package, Wrench, Cpu, Clock } from "lucide-react";
import { SiApple, SiSamsung, SiGoogle, SiOneplus } from "react-icons/si";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { api } from "../lib/api";

const HERO_IMG = "https://images.unsplash.com/photo-1758186334264-d1ab8a079aa2?auto=format&fit=crop&w=1000&q=80";

function CountUp({ value, suffix = "" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let start = 0; const dur = 900; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.floor(start + (value - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span>{n.toLocaleString("nl-NL")}{suffix}</span>;
}

export default function HomePage() {
  const [reviews, setReviews] = useState({ reviews: [], average: 0, count: 0 });
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    api.get("/reviews").then((r) => setReviews(r.data)).catch(() => {});
    api.get("/faqs").then((r) => setFaqs(r.data.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section data-testid="hero" className="relative overflow-hidden grain">
        <div className="container-page pt-16 md:pt-24 pb-20 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <FadeUp>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EAEAEA] bg-white px-3 py-1 text-[12px] text-[#666666]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                Vandaag open · Amsterdam
              </div>
            </FadeUp>
            <FadeUp delay={0.05}>
              <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl tracking-tight font-semibold text-[#111111] leading-[1.02]">
                Professionele smartphone­reparaties.
                <br />
                <span className="text-[#666666]">Zonder gedoe.</span>
              </h1>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-6 text-lg md:text-xl text-[#666666] leading-relaxed max-w-xl">
                Snelle reparaties. Premium onderdelen. Transparante prijzen. Vertrouwde service, meestal binnen 1 uur klaar.
              </p>
            </FadeUp>
            <FadeUp delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/booking" data-testid="hero-book-btn">
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3.5 text-[15px] font-medium hover:bg-[#333] transition-colors shadow-sm hover:shadow-md">
                    Reparatie boeken <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </motion.span>
                </Link>
                <Link to="/pricing" data-testid="hero-pricing-btn">
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-white text-[#111111] border border-[#EAEAEA] px-6 py-3.5 text-[15px] font-medium hover:bg-[#FAFAFA] transition-colors">
                    Bekijk prijzen
                  </motion.span>
                </Link>
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-[13px] text-[#666666]">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#111111] text-[#111111]" strokeWidth={0} />)}
                  <span className="ml-1 text-[#111111] font-medium">{reviews.average || 4.9}</span>
                  <span>· {reviews.count || 250}+ reviews</span>
                </div>
                <div className="h-4 w-px bg-[#EAEAEA]" />
                <span>Levenslange garantie op scherm</span>
              </div>
            </FadeUp>
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative aspect-[4/5] w-full max-w-[520px] ml-auto rounded-[2rem] bg-[#FAFAFA] overflow-hidden border border-[#EAEAEA]"
            >
              <img src={HERO_IMG} loading="eager" alt="Premium smartphone" className="absolute inset-0 h-full w-full object-cover" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-6 left-6 rounded-2xl bg-white/95 backdrop-blur border border-[#EAEAEA] px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#111111]">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> Garantie inbegrepen
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-6 right-6 rounded-2xl bg-white/95 backdrop-blur border border-[#EAEAEA] px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#111111]">
                  <Zap className="h-4 w-4" strokeWidth={1.5} /> Klaar binnen 1 uur
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-24 left-6 rounded-2xl bg-white/95 backdrop-blur border border-[#EAEAEA] px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#111111]">
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} /> Premium onderdelen
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="flex justify-center pb-8">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-[#666666]">
            <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
          </motion.div>
        </div>
      </section>

      {/* TRUST */}
      <Section className="border-t border-[#EAEAEA]">
        <FadeUp>
          <SectionEyebrow>Waarom Refixion</SectionEyebrow>
          <SectionHeading className="max-w-3xl">Vertrouwen dat je kunt zien.</SectionHeading>
        </FadeUp>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { k: "average", label: "Gemiddelde rating", value: reviews.average || 4.9, suffix: "★" },
            { k: "count", label: "Tevreden klanten", value: 2500, suffix: "+" },
            { k: "warranty", label: "Garantie op scherm", value: "Levenslang", plain: true },
            { k: "time", label: "Gemiddelde tijd", value: 45, suffix: " min" },
          ].map((s, i) => (
            <FadeUp key={s.k} delay={i * 0.05}>
              <div data-testid={`trust-card-${s.k}`} className="rounded-2xl bg-white border border-[#EAEAEA] p-6 h-full">
                <div className="text-[12px] uppercase tracking-wider text-[#666666]">{s.label}</div>
                <div className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">
                  {s.plain ? s.value : <><CountUp value={typeof s.value === "number" ? s.value : 0} />{s.suffix}</>}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="bg-[#FAFAFA] border-t border-[#EAEAEA]">
        <FadeUp>
          <SectionEyebrow>Hoe het werkt</SectionEyebrow>
          <SectionHeading>Vijf stappen. Één gerepareerd toestel.</SectionHeading>
        </FadeUp>
        <div className="mt-14 grid md:grid-cols-5 gap-6">
          {[
            { n: "01", t: "Kies je toestel", d: "Selecteer je merk en model." },
            { n: "02", t: "Kies reparatie", d: "Zie prijs, duur en garantie." },
            { n: "03", t: "Boek afspraak", d: "Kies datum, tijd en methode." },
            { n: "04", t: "Wij repareren", d: "Meestal terwijl u wacht." },
            { n: "05", t: "Klaar om te gaan", d: "Met garantie en zonder gedoe." },
          ].map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.05}>
              <div className="relative h-full rounded-2xl bg-white border border-[#EAEAEA] p-6">
                <div className="text-[12px] tracking-wider text-[#666666]">{s.n}</div>
                <div className="mt-3 text-[18px] font-medium text-[#111111]">{s.t}</div>
                <div className="mt-2 text-[14px] text-[#666666] leading-relaxed">{s.d}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* BRANDS */}
      <Section>
        <FadeUp>
          <SectionEyebrow>Ondersteunde merken</SectionEyebrow>
          <SectionHeading>Repareer elk toestel dat je bezit.</SectionHeading>
        </FadeUp>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: SiApple, name: "Apple", slug: "apple", desc: "iPhone" },
            { icon: SiSamsung, name: "Samsung", slug: "samsung", desc: "Galaxy" },
            { icon: SiGoogle, name: "Google", slug: "google", desc: "Pixel" },
            { icon: SiOneplus, name: "OnePlus", slug: "oneplus", desc: "OnePlus" },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <FadeUp key={b.slug} delay={i * 0.05}>
                <Link
                  to={`/repairs?brand=${b.slug}`}
                  data-testid={`brand-card-${b.slug}`}
                  className="block h-full"
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="h-full rounded-2xl bg-white border border-[#EAEAEA] p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300"
                  >
                    <Icon className="h-8 w-8 text-[#111111]" />
                    <div className="mt-6 text-[18px] font-medium text-[#111111]">{b.name}</div>
                    <div className="text-[13px] text-[#666666] mt-1">{b.desc} reparaties</div>
                    <div className="mt-6 inline-flex items-center gap-1 text-[13px] text-[#111111]">
                      Bekijk reparaties <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </div>
                  </motion.div>
                </Link>
              </FadeUp>
            );
          })}
        </div>
      </Section>

      {/* WHY */}
      <Section className="border-t border-[#EAEAEA]">
        <FadeUp>
          <SectionEyebrow>Onze belofte</SectionEyebrow>
          <SectionHeading>Elk detail. Zorgvuldig doordacht.</SectionHeading>
        </FadeUp>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { Icon: Sparkles, t: "Premium onderdelen", d: "OEM en originele kwaliteit — nooit generieke troep." },
            { Icon: Wrench, t: "Professioneel gereedschap", d: "Gekalibreerd apparaat voor herhaalbare precisie." },
            { Icon: ShieldCheck, t: "Garantie", d: "Levenslange garantie op scherm. 12 maanden op de rest." },
            { Icon: Package, t: "Transparante prijzen", d: "De prijs die je online ziet is de prijs die je betaalt." },
            { Icon: Clock, t: "Snelle service", d: "De meeste reparaties zijn klaar terwijl u wacht." },
            { Icon: Cpu, t: "Ervaren technici", d: "Jarenlange ervaring in premium reparaties." },
          ].map(({ Icon, t, d }, i) => (
            <FadeUp key={t} delay={i * 0.04}>
              <div className="h-full rounded-2xl bg-white border border-[#EAEAEA] p-8">
                <Icon className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                <div className="mt-6 text-[18px] font-medium text-[#111111]">{t}</div>
                <div className="mt-2 text-[14px] text-[#666666] leading-relaxed">{d}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* REVIEWS */}
      <Section className="bg-[#FAFAFA] border-t border-[#EAEAEA]">
        <FadeUp>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <SectionEyebrow>Wat klanten zeggen</SectionEyebrow>
              <SectionHeading>Beoordeeld met {reviews.average || 4.9} van 5.</SectionHeading>
            </div>
            <Link to="/reviews" className="text-[14px] text-[#111111] hover:underline inline-flex items-center gap-1">
              Alle reviews bekijken <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </FadeUp>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {reviews.reviews.slice(0, 3).map((r, i) => (
            <FadeUp key={r.id} delay={i * 0.05}>
              <div data-testid={`review-card-${i}`} className="h-full rounded-2xl bg-white border border-[#EAEAEA] p-8">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(r.rating)].map((_, k) => <Star key={k} className="h-4 w-4 fill-[#111111] text-[#111111]" strokeWidth={0} />)}
                </div>
                <p className="text-[15px] text-[#111111] leading-relaxed">"{r.text}"</p>
                <div className="mt-6 flex items-center justify-between text-[13px]">
                  <div>
                    <div className="text-[#111111] font-medium">{r.name}</div>
                    <div className="text-[#666666]">{r.device}</div>
                  </div>
                  <div className="text-[#666666]">{new Date(r.date).toLocaleDateString("nl-NL")}</div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <FadeUp>
          <SectionEyebrow>Veelgestelde vragen</SectionEyebrow>
          <SectionHeading>Alles wat je moet weten.</SectionHeading>
        </FadeUp>
        <div className="mt-12 max-w-3xl">
          {faqs.map((f, i) => (
            <FadeUp key={f.id} delay={i * 0.03}>
              <button
                data-testid={`faq-item-${i}`}
                onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)}
                className="w-full text-left border-b border-[#EAEAEA] py-6 group"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="text-[16px] md:text-[18px] font-medium text-[#111111]">{f.question}</div>
                  <ChevronDown className={`h-5 w-5 text-[#666666] transition-transform duration-300 ${openFaq === f.id ? "rotate-180" : ""}`} strokeWidth={1.5} />
                </div>
                {openFaq === f.id && (
                  <div className="mt-3 text-[15px] text-[#666666] leading-relaxed">{f.answer}</div>
                )}
              </button>
            </FadeUp>
          ))}
          <div className="mt-8">
            <Link to="/faq" className="text-[14px] text-[#111111] hover:underline inline-flex items-center gap-1">
              Alle vragen bekijken <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-[#111111] text-white">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl tracking-tight font-semibold">Klaar om je toestel te repareren?</h2>
            <p className="mt-6 text-lg text-white/60">Boek vandaag nog een afspraak. Meestal binnen 1 uur klaar.</p>
            <div className="mt-10">
              <Link to="/booking" data-testid="final-cta-btn">
                <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-white text-[#111111] px-8 py-4 text-[15px] font-medium hover:bg-white/90 transition-colors">
                  Reparatie boeken <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </motion.span>
              </Link>
            </div>
          </div>
        </FadeUp>
      </Section>
    </div>
  );
}
