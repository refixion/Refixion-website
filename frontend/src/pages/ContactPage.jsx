import React, { useEffect, useState } from "react";
import { FadeUp, Section, SectionEyebrow, SectionHeading } from "../components/site/primitives";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

export default function ContactPage() {
  const [ws, setWs] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  useEffect(() => { api.get("/workshop").then((r) => setWs(r.data)); }, []);
  const submit = (e) => {
    e.preventDefault();
    toast.success("Bedankt! We nemen zo snel mogelijk contact op.");
    setForm({ name: "", email: "", message: "" });
  };
  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <SectionEyebrow>Contact</SectionEyebrow>
          <SectionHeading>We horen graag van je.</SectionHeading>
        </FadeUp>
        <div className="mt-14 grid lg:grid-cols-2 gap-10">
          <FadeUp>
            <div className="rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] p-8">
              <div className="space-y-6 text-[14px] text-[#111111]">
                <div className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-[#666666]" strokeWidth={1.5} /><div><div className="text-[12px] uppercase tracking-wider text-[#666666] mb-1">Adres</div>{ws?.address}, {ws?.postal_code} {ws?.city}</div></div>
                <div className="flex items-start gap-3"><Mail className="h-4 w-4 mt-0.5 text-[#666666]" strokeWidth={1.5} /><div><div className="text-[12px] uppercase tracking-wider text-[#666666] mb-1">E-mail</div>{ws?.email}</div></div>
                <div className="flex items-start gap-3"><Phone className="h-4 w-4 mt-0.5 text-[#666666]" strokeWidth={1.5} /><div><div className="text-[12px] uppercase tracking-wider text-[#666666] mb-1">Telefoon</div>{ws?.phone}</div></div>
                <div className="flex items-start gap-3"><Clock className="h-4 w-4 mt-0.5 text-[#666666]" strokeWidth={1.5} /><div><div className="text-[12px] uppercase tracking-wider text-[#666666] mb-1">Openingstijden</div>{ws?.opening_hours && ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((d) => {
                  const h = ws.opening_hours[d]; if (!h) return null;
                  const labels = {monday:"Ma", tuesday:"Di", wednesday:"Wo", thursday:"Do", friday:"Vr", saturday:"Za", sunday:"Zo"};
                  return <div key={d}>{labels[d]} · {h.closed ? "Gesloten" : `${h.open} – ${h.close}`}</div>;
                })}</div></div>
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.05}>
            <form onSubmit={submit} className="rounded-2xl bg-white border border-[#EAEAEA] p-8 space-y-4">
              <div>
                <label className="text-[12px] uppercase tracking-wider text-[#666666] block mb-2">Naam</label>
                <input data-testid="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111]" />
              </div>
              <div>
                <label className="text-[12px] uppercase tracking-wider text-[#666666] block mb-2">E-mail</label>
                <input data-testid="contact-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111]" />
              </div>
              <div>
                <label className="text-[12px] uppercase tracking-wider text-[#666666] block mb-2">Bericht</label>
                <textarea data-testid="contact-message" rows={5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111]" />
              </div>
              <button data-testid="contact-submit" type="submit" className="rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]">Verstuur bericht</button>
            </form>
          </FadeUp>
        </div>
      </Section>
    </div>
  );
}
