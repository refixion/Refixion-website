import React, { useEffect, useState } from "react";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { ChevronDown } from "lucide-react";
import { api } from "../lib/api";

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => { api.get("/faqs").then((r) => setFaqs(r.data)); }, []);
  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <SectionHeading>Veelgestelde vragen.</SectionHeading>
        </FadeUp>
        <div className="mt-12 max-w-3xl">
          {faqs.map((f, i) => (
            <FadeUp key={f.id} delay={Math.min(i * 0.02, 0.15)}>
              <button data-testid={`faqp-${i}`} onClick={() => setOpen(open === f.id ? null : f.id)} className="w-full text-left border-b border-[#EAEAEA] py-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="text-[16px] md:text-[18px] font-medium text-[#111111]">{f.question}</div>
                  <ChevronDown className={`h-5 w-5 text-[#666666] transition-transform ${open === f.id ? "rotate-180" : ""}`} strokeWidth={1.5} />
                </div>
                {open === f.id && <div className="mt-3 text-[15px] text-[#666666] leading-relaxed">{f.answer}</div>}
              </button>
            </FadeUp>
          ))}
        </div>
      </Section>
    </div>
  );
}
