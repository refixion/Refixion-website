import React, { useEffect, useState } from "react";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { Check, X, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

export default function WarrantyPage() {
  const [data, setData] = useState({ items: [], general_text: "" });
  useEffect(() => { api.get("/warranties").then((r) => setData(r.data)); }, []);

  // Group by repair_id
  const groups = {};
  data.items.forEach((w) => { (groups[w.repair_id] ??= []).push(w); });

  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Garantie</SectionEyebrow>
          <SectionHeading className="max-w-3xl">Duidelijke garantie op iedere reparatie.</SectionHeading>
          <p className="mt-6 max-w-3xl text-lg text-[#666666] leading-relaxed">Elke reparatie komt met een schriftelijke garantie op het vervangen onderdeel en het uitgevoerde werk. Hieronder ziet u precies wat er per reparatie is gedekt — en wat niet.</p>
        </FadeUp>

        <div className="mt-14 space-y-6">
          {Object.entries(groups).map(([repairId, items]) => (
            <FadeUp key={repairId}>
              <div className="rounded-2xl bg-white border border-[#EAEAEA] p-6 md:p-8" data-testid={`warranty-group-${repairId}`}>
                <div className="text-[12px] uppercase tracking-wider text-[#666666] mb-4">{repairId.replace("rep-", "")}</div>
                <div className="grid md:grid-cols-3 gap-4">
                  {items.map((w) => (
                    <div key={w.id} className="rounded-xl border border-[#EAEAEA] p-5 h-full">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
                        <div className="text-[15px] font-medium text-[#111111]">{w.label}</div>
                      </div>
                      <div className="mt-2 text-[13px] text-[#111111] font-medium">{w.warranty_label}</div>
                      {w.covers?.length > 0 && (
                        <div className="mt-4">
                          <div className="text-[11px] uppercase tracking-wider text-[#666666] mb-2">Gedekt</div>
                          <ul className="space-y-1.5 text-[13px] text-[#111111]">
                            {w.covers.map((c, i) => <li key={i} className="flex items-start gap-2"><Check className="h-3.5 w-3.5 mt-0.5 text-[#16A34A] shrink-0" strokeWidth={2} /><span>{c}</span></li>)}
                          </ul>
                        </div>
                      )}
                      {w.excludes?.length > 0 && (
                        <div className="mt-4">
                          <div className="text-[11px] uppercase tracking-wider text-[#666666] mb-2">Niet gedekt</div>
                          <ul className="space-y-1.5 text-[13px] text-[#666666]">
                            {w.excludes.map((c, i) => <li key={i} className="flex items-start gap-2"><X className="h-3.5 w-3.5 mt-0.5 text-[#DC2626] shrink-0" strokeWidth={2} /><span>{c}</span></li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {data.general_text && (
          <FadeUp>
            <div className="mt-10 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] p-6 md:p-8">
              <div className="text-[12px] uppercase tracking-wider text-[#666666] mb-2">Algemene voorwaarden</div>
              <p className="text-[14px] text-[#111111] leading-relaxed">{data.general_text}</p>
            </div>
          </FadeUp>
        )}

        <div className="mt-12">
          <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]">
            Boek een reparatie
          </Link>
        </div>
      </Section>
    </div>
  );
}
