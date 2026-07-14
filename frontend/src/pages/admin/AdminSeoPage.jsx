import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

export default function AdminSeoPage() {
  const [rows, setRows] = useState([]);
  const load = () => api.get("/admin/seo").then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const save = async (row) => {
    await api.put("/admin/seo", row);
    toast.success("SEO opgeslagen");
    load();
  };

  return (
    <div>
      <h1 className="text-3xl tracking-tight font-semibold">SEO.</h1>
      <p className="mt-2 text-[14px] text-[#666666]">Bewerk de meta-tags voor elke pagina. Deze verschijnen in zoekmachine-resultaten en social media previews.</p>

      <div className="mt-8 space-y-4">
        {rows.map((r, i) => (
          <div key={r.path} className="rounded-2xl bg-white border border-[#EAEAEA] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[12px] uppercase tracking-wider text-[#666666]">Route</div>
              <div className="text-[13px] font-medium text-[#111111]">{r.path}</div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Titel (tab & search)</label>
                <input data-testid={`seo-title-${r.path}`} value={r.title || ""} onChange={(e) => { const c = [...rows]; c[i] = { ...r, title: e.target.value }; setRows(c); }} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
                <div className="text-[11px] text-[#666666] mt-1">{(r.title || "").length} / 60 tekens</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Meta description</label>
                <textarea data-testid={`seo-desc-${r.path}`} rows={2} value={r.description || ""} onChange={(e) => { const c = [...rows]; c[i] = { ...r, description: e.target.value }; setRows(c); }} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
                <div className="text-[11px] text-[#666666] mt-1">{(r.description || "").length} / 160 tekens</div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">OG title (social)</label>
                <input value={r.og_title || ""} onChange={(e) => { const c = [...rows]; c[i] = { ...r, og_title: e.target.value }; setRows(c); }} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">OG description</label>
                <input value={r.og_description || ""} onChange={(e) => { const c = [...rows]; c[i] = { ...r, og_description: e.target.value }; setRows(c); }} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">OG image URL (1200x630)</label>
                <input value={r.og_image || ""} onChange={(e) => { const c = [...rows]; c[i] = { ...r, og_image: e.target.value }; setRows(c); }} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button data-testid={`seo-save-${r.path}`} onClick={() => save(rows[i])} className="rounded-full bg-[#111111] text-white px-5 py-2 text-[13px] font-medium">Opslaan</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
