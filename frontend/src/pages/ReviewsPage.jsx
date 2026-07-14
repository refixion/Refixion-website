import React, { useEffect, useState } from "react";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { Star } from "lucide-react";
import { api } from "../lib/api";

export default function ReviewsPage() {
  const [data, setData] = useState({ reviews: [], average: 0, count: 0 });
  useEffect(() => { api.get("/reviews").then((r) => setData(r.data)); }, []);
  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Reviews</SectionEyebrow>
          <SectionHeading>Beoordeeld met {data.average} van 5.</SectionHeading>
          <div className="mt-6 flex items-center gap-2 text-[14px] text-[#666666]">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#111111] text-[#111111]" strokeWidth={0} />)}
            <span>·  {data.count} reviews</span>
          </div>
        </FadeUp>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.reviews.map((r, i) => (
            <FadeUp key={r.id} delay={Math.min(i * 0.03, 0.2)}>
              <div className="rounded-2xl bg-white border border-[#EAEAEA] p-8 h-full">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(r.rating)].map((_, k) => <Star key={k} className="h-4 w-4 fill-[#111111] text-[#111111]" strokeWidth={0} />)}
                </div>
                <p className="text-[15px] text-[#111111] leading-relaxed">"{r.text}"</p>
                <div className="mt-6 flex items-center justify-between text-[13px]">
                  <div><div className="text-[#111111] font-medium">{r.name}</div><div className="text-[#666666]">{r.device}</div></div>
                  <div className="text-[#666666]">{new Date(r.date).toLocaleDateString("nl-NL")}</div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>
    </div>
  );
}
