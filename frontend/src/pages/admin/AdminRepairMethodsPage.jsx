import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

export default function AdminRepairMethodsPage() {
  const [rows, setRows] = useState([]);
  const load = () => api.get("/admin/repair-methods").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);
  const save = async (m) => {
    const payload = { title: m.title, slug: m.slug, description: m.description, icon: m.icon, estimated_turnaround: m.estimated_turnaround, additional_price: Number(m.additional_price) || 0, info: m.info || "", enabled: !!m.enabled, order: Number(m.order) || 0 };
    await api.put(`/admin/repair-methods/${m.id}`, payload);
    toast.success("Opgeslagen");
    load();
  };
  return (
    <div>
      <h1 className="text-3xl tracking-tight font-semibold">Reparatiemethoden.</h1>
      <p className="mt-2 text-[14px] text-[#666666]">Alleen ingeschakelde methoden zijn zichtbaar voor klanten.</p>
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {rows.map((m, i) => (
          <div key={m.id} className="rounded-2xl bg-white border border-[#EAEAEA] p-6">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-medium">{m.title}</div>
              <label className="inline-flex items-center gap-2 text-[13px]">
                <input data-testid={`method-enabled-${m.slug}`} type="checkbox" checked={m.enabled} onChange={(e) => { const upd = [...rows]; upd[i] = { ...m, enabled: e.target.checked }; setRows(upd); }} className="h-4 w-4 accent-[#111111]" />
                Ingeschakeld
              </label>
            </div>
            {[
              ["Titel", "title"], ["Beschrijving", "description"], ["Icon", "icon"],
              ["Turnaround", "estimated_turnaround"], ["Extra prijs (EUR)", "additional_price"], ["Info", "info"],
              ["Volgorde", "order"],
            ].map(([label, key]) => (
              <div key={key} className="mt-3">
                <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">{label}</label>
                <input value={m[key] ?? ""} onChange={(e) => { const upd = [...rows]; upd[i] = { ...m, [key]: e.target.value }; setRows(upd); }} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
              </div>
            ))}
            <button data-testid={`method-save-${m.slug}`} onClick={() => save(rows[i])} className="mt-4 rounded-full bg-[#111111] text-white px-5 py-2 text-[13px] font-medium">Opslaan</button>
          </div>
        ))}
      </div>
    </div>
  );
}
