import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Admin → Garanties. Manage per-repair warranty catalog (label / days / covers / excludes)
 * and the general warranty terms text.
 */
export default function AdminWarrantiesPage() {
  const [rows, setRows] = useState([]);
  const [general, setGeneral] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const [w, g, rp] = await Promise.all([
      api.get("/admin/warranties"),
      api.get("/admin/general-warranty"),
      api.get("/admin/repairs"),
    ]);
    setRows(w.data);
    setGeneral(g.data.value || "");
    // Repairs for the create-warranty dropdown
    window.__refixion_repairs = rp.data;
  };
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const m = {};
    rows.forEach((r) => { (m[r.repair_id] ??= []).push(r); });
    return m;
  }, [rows]);

  const saveRow = async (r) => {
    try {
      await api.put(`/admin/warranties/${r.id}`, {
        repair_id: r.repair_id, quality_key: r.quality_key, label: r.label,
        warranty_days: Number(r.warranty_days) || 0, warranty_label: r.warranty_label,
        covers: r.covers || [], excludes: r.excludes || [], order: Number(r.order) || 1, enabled: !!r.enabled,
      });
      toast.success("Garantie opgeslagen");
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  const deleteRow = async (r) => {
    if (!window.confirm(`Garantie "${r.label}" verwijderen?`)) return;
    await api.delete(`/admin/warranties/${r.id}`);
    toast.success("Verwijderd");
    load();
  };

  const saveGeneral = async () => {
    await api.put("/admin/general-warranty", { value: general });
    toast.success("Algemene tekst opgeslagen");
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="text-3xl tracking-tight font-semibold">Garanties.</h1>
        <button data-testid="warranty-add" onClick={() => setCreating(true)} className="rounded-full bg-[#111111] text-white px-5 py-2.5 text-[13px] font-medium inline-flex items-center gap-2 hover:bg-[#333]">
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Garantie toevoegen
        </button>
      </div>
      <p className="text-[14px] text-[#666666]">Beheer voor elke reparatie welke onderdelen gedekt zijn en welke niet. Ook zichtbaar op /garantie.</p>

      <div className="mt-6 rounded-2xl bg-white border border-[#EAEAEA] p-6">
        <div className="text-[15px] font-medium">Algemene garantietekst</div>
        <textarea data-testid="warranty-general" rows={4} value={general} onChange={(e) => setGeneral(e.target.value)} className="mt-3 w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
        <button data-testid="warranty-general-save" onClick={saveGeneral} className="mt-3 rounded-full bg-[#111111] text-white px-5 py-2 text-[13px] font-medium">Tekst opslaan</button>
      </div>

      <div className="mt-8 space-y-6">
        {Object.entries(grouped).map(([repairId, items]) => (
          <div key={repairId} className="rounded-2xl bg-white border border-[#EAEAEA] p-6">
            <div className="text-[12px] uppercase tracking-wider text-[#666666] mb-4">{repairId.replace("rep-", "")}</div>
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((r, i) => (
                <WarrantyRow key={r.id} row={r} onChange={(patch) => {
                  const idx = rows.findIndex((x) => x.id === r.id);
                  const copy = [...rows]; copy[idx] = { ...r, ...patch }; setRows(copy);
                }} onSave={() => saveRow(rows.find((x) => x.id === r.id))} onDelete={() => deleteRow(r)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>{creating && <CreateWarrantyModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}</AnimatePresence>
    </div>
  );
}

function WarrantyRow({ row, onChange, onSave, onDelete }) {
  const covers = row.covers || [];
  const excludes = row.excludes || [];
  return (
    <div className="rounded-xl border border-[#EAEAEA] p-4">
      <div className="flex items-center justify-between gap-3">
        <input data-testid={`war-label-${row.id}`} value={row.label || ""} onChange={(e) => onChange({ label: e.target.value })} className="text-[14px] font-medium text-[#111111] rounded-lg border border-transparent hover:border-[#EAEAEA] focus:border-[#111111] outline-none px-2 py-1 w-full" />
        <button onClick={onDelete} className="text-[#666666] hover:text-[#DC2626] p-1" aria-label="verwijderen"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[#666666] block">Dagen</label>
          <input data-testid={`war-days-${row.id}`} type="number" value={row.warranty_days ?? 0} onChange={(e) => onChange({ warranty_days: Number(e.target.value) })} className="w-full rounded-lg border border-[#EAEAEA] px-2 py-1 text-[13px]" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[#666666] block">Label</label>
          <input value={row.warranty_label || ""} onChange={(e) => onChange({ warranty_label: e.target.value })} className="w-full rounded-lg border border-[#EAEAEA] px-2 py-1 text-[13px]" />
        </div>
      </div>
      <StringList label="Gedekt" items={covers} onChange={(items) => onChange({ covers: items })} />
      <StringList label="Niet gedekt" items={excludes} onChange={(items) => onChange({ excludes: items })} />
      <div className="mt-3 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-[12px] text-[#666666]">
          <input type="checkbox" checked={!!row.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} className="accent-[#111111] h-4 w-4" /> Zichtbaar
        </label>
        <button data-testid={`war-save-${row.id}`} onClick={onSave} className="rounded-full bg-[#111111] text-white px-4 py-1.5 text-[12px] font-medium">Opslaan</button>
      </div>
    </div>
  );
}

function StringList({ label, items, onChange }) {
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">{label}</div>
      <div className="space-y-1">
        {items.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={s} onChange={(e) => { const c = [...items]; c[i] = e.target.value; onChange(c); }} className="flex-1 rounded-lg border border-[#EAEAEA] px-2 py-1 text-[12px]" />
            <button onClick={() => onChange(items.filter((_, k) => k !== i))} className="text-[#666666] hover:text-[#DC2626]"><X className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ""])} className="text-[12px] text-[#111111] underline underline-offset-2">+ regel toevoegen</button>
      </div>
    </div>
  );
}

function CreateWarrantyModal({ onClose, onCreated }) {
  const repairs = window.__refixion_repairs || [];
  const [form, setForm] = useState({ repair_id: repairs[0]?.id || "", quality_key: "standard", label: "", warranty_days: 365, warranty_label: "12 maanden garantie", covers: [], excludes: [], order: 1, enabled: true });
  const save = async () => {
    try {
      await api.post("/admin/warranties", form);
      toast.success("Aangemaakt");
      onCreated();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl border border-[#EAEAEA] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-[15px] font-medium mb-4">Nieuwe garantie</div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Reparatie</label>
            <select value={form.repair_id} onChange={(e) => setForm({ ...form, repair_id: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]">
              {repairs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Kwaliteit-sleutel (bv. standard / original)</label>
            <input value={form.quality_key} onChange={(e) => setForm({ ...form, quality_key: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Label</label>
            <input data-testid="new-warranty-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Dagen</label><input type="number" value={form.warranty_days} onChange={(e) => setForm({ ...form, warranty_days: Number(e.target.value) })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" /></div>
            <div><label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Label</label><input value={form.warranty_label} onChange={(e) => setForm({ ...form, warranty_label: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" /></div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-[#EAEAEA] px-4 py-2 text-[13px]">Annuleren</button>
          <button data-testid="new-warranty-save" onClick={save} className="rounded-full bg-[#111111] text-white px-5 py-2 text-[13px] font-medium">Aanmaken</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
