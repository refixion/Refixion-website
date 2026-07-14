import React from "react";
import { Link } from "react-router-dom";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { ArrowRight, Briefcase, Building2, Users } from "lucide-react";

export default function BusinessPage() {
  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Zakelijk</SectionEyebrow>
          <SectionHeading className="max-w-3xl">Reparaties voor je hele team.</SectionHeading>
          <p className="mt-8 max-w-3xl text-lg text-[#666666] leading-relaxed">Voor MKB, corporates en startups. Snelle turnaround, gefactureerde betaling, on-site service en volumekortingen. Zodat jouw team altijd door kan werken.</p>
        </FadeUp>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { Icon: Building2, t: "On-site service", d: "Onze technicus komt naar jouw kantoor." },
            { Icon: Users, t: "Volumekortingen", d: "Prijzen afgestemd op de omvang van je vloot." },
            { Icon: Briefcase, t: "Factuur en betaaltermijn", d: "Nette factuur met 14 dagen betaaltermijn." },
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

        <FadeUp>
          <div className="mt-14 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-[20px] font-medium text-[#111111]">Interesse in een zakelijk partnership?</div>
              <div className="text-[14px] text-[#666666] mt-2">We stellen graag een voorstel op maat voor je op.</div>
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
