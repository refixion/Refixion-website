import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SiApple, SiSamsung } from "react-icons/si";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { api } from "../lib/api";
import { useSiteContent } from "../lib/useSiteContent";
import { resolveIcon } from "../lib/icons";
import { t } from "../i18n";

function CountUp({ value, suffix = "" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = 0; const dur = 900; const t0 = performance.now();
    const step = (ts) => {
      const p = Math.min(1, (ts - t0) / dur);
      setN(Math.floor(start + (Number(value) - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span>{Number.isFinite(n) ? n.toLocaleString("nl-NL") : "0"}{suffix}</span>;
}

export default function HomePage() {
  const content = useSiteContent();
  console.log("REFIXION CONTENT:", content);
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    api.get("/faqs").then((r) => setFaqs(r.data.slice(0, 5))).catch(() => {});
  }, []);

  if (!content) return <div className="min-h-[60vh] bg-white" />;

const {
  hero = {},
  trust = { cards: [] },
  how_it_works = { steps: [] },
  brands_section = {},
  why = { items: [] },
  faq_section = {},
  cta = {}
} = content;
if (!hero) return <div className="min-h-[60vh] bg-white" />;


  const trustCardValue = (card) => {
    if (card.value_type === "number") return { numeric: Number(card.value) || 0, display: card.value, isNumber: true };
    return { numeric: null, display: card.value || "", isNumber: false };
  };

  return (
    <div className="bg-white">
      {/* HERO */}
      <section data-testid="hero" className="relative overflow-hidden grain">
        <div className="container-page pt-16 md:pt-24 pb-20 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {hero.badge_enabled && (
              <FadeUp>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#EAEAEA] bg-white px-3 py-1 text-[12px] text-[#666666]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  {hero.badge_text}
                </div>
              </FadeUp>
            )}
            <FadeUp delay={0.05}>
              <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl tracking-tight font-semibold text-[#111111] leading-[1.02]">
                {hero.headline_line1}
                {hero.headline_line2 && <><br /><span className="text-[#666666]">{hero.headline_line2}</span></>}
              </h1>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-6 text-lg md:text-xl text-[#666666] leading-relaxed max-w-xl">{hero.subtitle}</p>
            </FadeUp>
            <FadeUp delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={hero.primary_button_link || "/booking"} data-testid="hero-book-btn">
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3.5 text-[15px] font-medium hover:bg-[#333] transition-colors shadow-sm hover:shadow-md">
                    {hero.primary_button_label} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </motion.span>
                </Link>
                {hero.secondary_button_label && (
                  <Link to={hero.secondary_button_link || "/pricing"} data-testid="hero-pricing-btn">
                    <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-white text-[#111111] border border-[#EAEAEA] px-6 py-3.5 text-[15px] font-medium hover:bg-[#FAFAFA] transition-colors">
                      {hero.secondary_button_label}
                    </motion.span>
                  </Link>
                )}
              </div>
            </FadeUp>
            {hero.rating_line_enabled && hero.rating_line_suffix && (
              <FadeUp delay={0.2}>
                <div className="mt-10 flex flex-wrap items-center gap-6 text-[13px] text-[#666666]">
                  <span>{hero.rating_line_suffix}</span>
                </div>
              </FadeUp>
            )}
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative aspect-[4/5] w-full max-w-[520px] ml-auto rounded-[2rem] bg-[#FAFAFA] overflow-hidden border border-[#EAEAEA]"
            >
              {hero.hero_image_url && <img src={hero.hero_image_url} loading="eager" alt="Premium smartphone" className="absolute inset-0 h-full w-full object-cover" />}
              {(hero.floating_cards || []).map((c, i) => {
                const Icon = resolveIcon(c.icon);
                const positions = [
                  { className: "top-6 left-6", delay: 0 },
                  { className: "bottom-6 right-6", delay: 0.3 },
                  { className: "bottom-24 left-6", delay: 0.6 },
                ][i] || { className: "top-24 right-6", delay: 0.9 };
                return (
                  <motion.div
                    key={i}
                    animate={{ y: [0, i % 2 === 0 ? -8 : 8, 0] }}
                    transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: positions.delay }}
                    className={`absolute ${positions.className} rounded-2xl bg-white/95 backdrop-blur border border-[#EAEAEA] px-4 py-3 shadow-sm`}
                  >
                    <div className="flex items-center gap-2 text-[13px] font-medium text-[#111111]">
                      <Icon className="h-4 w-4" strokeWidth={1.5} /> {c.text}
                    </div>
                  </motion.div>
                );
              })}
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
          <SectionEyebrow>{trust.eyebrow}</SectionEyebrow>
          <SectionHeading className="max-w-3xl">{trust.heading}</SectionHeading>
        </FadeUp>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {(trust.cards || []).map((c, i) => {
            const v = trustCardValue(c);
            return (
              <FadeUp key={i} delay={i * 0.05}>
                <div data-testid={`trust-card-${i}`} className="rounded-2xl bg-white border border-[#EAEAEA] p-6 h-full">
                  <div className="text-[12px] uppercase tracking-wider text-[#666666]">{c.label}</div>
                  <div className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">
                    {v.isNumber && v.numeric !== null ? <><CountUp value={v.numeric} />{c.suffix}</> : v.isNumber ? <>{v.display}{c.suffix}</> : v.display}
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="bg-[#FAFAFA] border-t border-[#EAEAEA]">
        <FadeUp>
          <SectionEyebrow>{how_it_works.eyebrow}</SectionEyebrow>
          <SectionHeading>{how_it_works.heading}</SectionHeading>
        </FadeUp>
        <div className="mt-14 grid md:grid-cols-5 gap-6">
          {(how_it_works.steps || []).map((s, i) => (
            <FadeUp key={i} delay={i * 0.05}>
              <div className="relative h-full rounded-2xl bg-white border border-[#EAEAEA] p-6">
                <div className="text-[12px] tracking-wider text-[#666666]">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-3 text-[18px] font-medium text-[#111111]">{s.title}</div>
                <div className="mt-2 text-[14px] text-[#666666] leading-relaxed">{s.description}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* BRANDS */}
      <Section>
        <FadeUp>
          <SectionEyebrow>{brands_section.eyebrow}</SectionEyebrow>
          <SectionHeading>{brands_section.heading}</SectionHeading>
        </FadeUp>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: SiApple, name: "Apple", slug: "apple", desc: "iPhone" },
            { icon: SiSamsung, name: "Samsung", slug: "samsung", desc: "Galaxy" },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <FadeUp key={b.slug} delay={i * 0.05}>
                <Link to={`/repairs?brand=${b.slug}`} data-testid={`brand-card-${b.slug}`} className="block h-full">
                  <motion.div whileHover={{ y: -4 }} className="h-full rounded-2xl bg-white border border-[#EAEAEA] p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
                    <Icon className="h-8 w-8 text-[#111111]" />
                    <div className="mt-6 text-[18px] font-medium text-[#111111]">{b.name}</div>
                    <div className="text-[13px] text-[#666666] mt-1">{b.desc} reparaties</div>
                    <div className="mt-6 inline-flex items-center gap-1 text-[13px] text-[#111111]">Bekijk reparaties <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></div>
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
          <SectionEyebrow>{why.eyebrow}</SectionEyebrow>
          <SectionHeading>{why.heading}</SectionHeading>
        </FadeUp>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {(why.items || []).map((item, i) => {
            const Icon = resolveIcon(item.icon);
            return (
              <FadeUp key={i} delay={i * 0.04}>
                <div className="h-full rounded-2xl bg-white border border-[#EAEAEA] p-8">
                  <Icon className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                  <div className="mt-6 text-[18px] font-medium text-[#111111]">{item.title}</div>
                  <div className="mt-2 text-[14px] text-[#666666] leading-relaxed">{item.description}</div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <FadeUp>
          <SectionEyebrow>{faq_section.eyebrow}</SectionEyebrow>
          <SectionHeading>{faq_section.heading}</SectionHeading>
        </FadeUp>
        <div className="mt-12 max-w-3xl">
          {faqs.map((f, i) => (
            <FadeUp key={f.id} delay={i * 0.03}>
              <button data-testid={`faq-item-${i}`} onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} className="w-full text-left border-b border-[#EAEAEA] py-6 group">
                <div className="flex items-center justify-between gap-6">
                  <div className="text-[16px] md:text-[18px] font-medium text-[#111111]">{f.question}</div>
                  <ChevronDown className={`h-5 w-5 text-[#666666] transition-transform duration-300 ${openFaq === f.id ? "rotate-180" : ""}`} strokeWidth={1.5} />
                </div>
                {openFaq === f.id && <div className="mt-3 text-[15px] text-[#666666] leading-relaxed">{f.answer}</div>}
              </button>
            </FadeUp>
          ))}
          <div className="mt-8">
            <Link to="/faq" className="text-[14px] text-[#111111] hover:underline inline-flex items-center gap-1">
              {faq_section.link_label} <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-[#111111] text-white">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl tracking-tight font-semibold">{cta.heading}</h2>
            <p className="mt-6 text-lg text-white/60">{cta.subtitle}</p>
            <div className="mt-10">
              <Link to={cta.button_link || "/booking"} data-testid="final-cta-btn">
                <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-white text-[#111111] px-8 py-4 text-[15px] font-medium hover:bg-white/90 transition-colors">
                  {cta.button_label} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </motion.span>
              </Link>
            </div>
          </div>
        </FadeUp>
      </Section>
    </div>
  );
}
