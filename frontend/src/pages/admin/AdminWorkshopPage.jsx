import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const DAYS = [
  ["monday","Maandag"],["tuesday","Dinsdag"],["wednesday","Woensdag"],["thursday","Donderdag"],
  ["friday","Vrijdag"],["saturday","Zaterdag"],["sunday","Zondag"]
];

export default function AdminWorkshopPage() {
  const [w, setW] = useState(null);
  useEffect(() => { api.get("/workshop").then((r) => setW(r.data)); }, []);
  if (!w) return <div className="text-[#666666]">Laden...</div>;
  const save = async () => {
    const { id, ...payload } = w;
    await api.put("/admin/workshop", payload);
    toast.success("Opgeslagen");
  };
  const upd = (k, v) => setW({ ...w, [k]: v });
  const updHours = (day, k, v) => setW({ ...w, opening_hours: { ...w.opening_hours, [day]: { ...w.opening_hours[day], [k]: v } } });
  return (
    <div>
      <h1 className="text-3xl tracking-tight font-semibold">Werkplaats.</h1>
      <p className="mt-2 text-[14px] text-[#666666]">Wordt overal op de website getoond.</p>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-[#EAEAEA] p-6 space-y-3">
          <div className="text-[15px] font-medium mb-2">Bedrijfsgegevens</div>
          {[
            ["business_name", "Bedrijfsnaam"],["workshop_name","Werkplaats naam"],["address","Adres"],["postal_code","Postcode"],["city","Plaats"],["country","Land"],["email","E-mail"],["phone","Telefoon"],["google_maps_link","Google Maps link"],["parking_instructions","Parkeer instructies"],["doorbell_instructions","Bel instructies"],
          ].map(([k, l]) => (
            <div key={k}><label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">{l}</label>
              <input data-testid={`ws-${k}`} value={w[k] || ""} onChange={(e) => upd(k, e.target.value)} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
            </div>
          ))}
          <div><label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Max boekingen per dag</label>
            <input type="number" value={w.max_bookings_per_day} onChange={(e) => upd("max_bookings_per_day", Number(e.target.value))} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
          </div>
          <div><label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Interval (min)</label>
            <input type="number" value={w.appointment_interval_minutes} onChange={(e) => upd("appointment_interval_minutes", Number(e.target.value))} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#EAEAEA] p-6">
          <div className="text-[15px] font-medium mb-3">Openingstijden</div>
          {DAYS.map(([d, l]) => (
            <div key={d} className="flex items-center gap-3 py-2 border-b border-[#EAEAEA] last:border-0">
              <div className="w-24 text-[13px] text-[#111111]">{l}</div>
              <label className="text-[12px] text-[#666666] inline-flex items-center gap-1"><input type="checkbox" checked={!w.opening_hours[d].closed} onChange={(e) => updHours(d, "closed", !e.target.checked)} className="accent-[#111111]" /> Open</label>
              <input value={w.opening_hours[d].open} onChange={(e) => updHours(d, "open", e.target.value)} disabled={w.opening_hours[d].closed} className="rounded-lg border border-[#EAEAEA] px-2 py-1 text-[13px] w-20" />
              <span className="text-[#666666]">–</span>
              <input value={w.opening_hours[d].close} onChange={(e) => updHours(d, "close", e.target.value)} disabled={w.opening_hours[d].closed} className="rounded-lg border border-[#EAEAEA] px-2 py-1 text-[13px] w-20" />
            </div>
          ))}
        </div>
      </div>
      <button data-testid="ws-save" onClick={save} className="mt-8 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium">Opslaan</button>
    </div>
  );
}
