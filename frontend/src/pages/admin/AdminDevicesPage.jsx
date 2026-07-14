import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, Plus, DollarSign, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDevicesPage() {
  const [brands, setBrands] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [editing, setEditing] = useState(null); // device being priced
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ brand_id: "", name: "", popular: false, order: 99 });

  const loadDevices = async () => {
    const r = await api.get("/admin/devices");
    setDevices(r.data);
  };
  useEffect(() => {
    api.get("/admin/brands").then((r) => { setBrands(r.data); if (!activeBrand && r.data[0]) setActiveBrand(r.data[0].id); });
    loadDevices();
    // eslint-disable-next-line
  }, []);

  const filtered = devices.filter((d) => d.brand_id === activeBrand).sort((a, b) => (a.order || 0) - (b.order || 0));

  const saveDevice = async (d, patch) => {
    await api.put(`/admin/devices/${d.id}`, { ...d, ...patch });
    toast.success("Opgeslagen");
    loadDevices();
  };
  const deleteDevice = async (d) => {
    if (!window.confirm(`Toestel "${d.name}" verwijderen?`)) return;
    await api.delete(`/admin/devices/${d.id}`);
    toast.success("Verwijderd");
    loadDevices();
  };
  const createDevice = async () => {
    if (!draft.brand_id || !draft.name.trim()) return toast.error("Merk en naam zijn vereist");
    await api.post("/admin/devices", draft);
    toast.success("Toegevoegd");
    setCreating(false);
    setDraft({ brand_id: activeBrand, name: "", popular: false, order: 99 });
    loadDevices();
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="text-3xl tracking-tight font-semibold">Toestellen & prijzen.</h1>
        <button
          data-testid="admin-device-add"
          onClick={() => { setDraft({ brand_id: activeBrand, name: "", popular: false, order: 99 }); setCreating(true); }}
          className="rounded-full bg-[#111111] text-white px-5 py-2.5 text-[13px] font-medium inline-flex items-center gap-2 hover:bg-[#333]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Toestel toevoegen
        </button>
      </div>
      <p className="text-[14px] text-[#666666]">Voeg toestellen toe per merk en stel afwijkende prijzen in per reparatie.</p>

      <div className="mt-6 flex items-center gap-2 flex-wrap">
        {brands.map((b) => (
          <button
            key={b.id}
            data-testid={`admin-brand-tab-${b.slug}`}
            onClick={() => setActiveBrand(b.id)}
            className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${activeBrand === b.id ? "border-[#111111] bg-[#111111] text-white" : "border-[#EAEAEA] bg-white text-[#111111] hover:bg-[#FAFAFA]"}`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-[#EAEAEA] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#FAFAFA] text-left text-[#666666]">
            <tr>
              <th className="px-4 py-3 font-medium">Naam</th>
              <th className="px-4 py-3 font-medium">Populair</th>
              <th className="px-4 py-3 font-medium">Volgorde</th>
              <th className="px-4 py-3 font-medium">Ingeschakeld</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-[#EAEAEA]">
                <td className="px-4 py-3 font-medium text-[#111111]">
                  <input
                    data-testid={`device-name-${d.id}`}
                    defaultValue={d.name}
                    onBlur={(e) => e.target.value !== d.name && saveDevice(d, { name: e.target.value })}
                    className="rounded-lg border border-transparent hover:border-[#EAEAEA] focus:border-[#111111] outline-none px-2 py-1 w-full"
                  />
                </td>
                <td className="px-4 py-3">
                  <input type="checkbox" data-testid={`device-popular-${d.id}`} checked={!!d.popular} onChange={(e) => saveDevice(d, { popular: e.target.checked })} className="accent-[#111111] h-4 w-4" />
                </td>
                <td className="px-4 py-3">
                  <input type="number" data-testid={`device-order-${d.id}`} defaultValue={d.order || 99} onBlur={(e) => Number(e.target.value) !== d.order && saveDevice(d, { order: Number(e.target.value) })} className="rounded-lg border border-transparent hover:border-[#EAEAEA] focus:border-[#111111] outline-none px-2 py-1 w-20" />
                </td>
                <td className="px-4 py-3">
                  <input type="checkbox" data-testid={`device-enabled-${d.id}`} checked={d.enabled !== false} onChange={(e) => saveDevice(d, { enabled: e.target.checked })} className="accent-[#111111] h-4 w-4" />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button data-testid={`device-prices-${d.id}`} onClick={() => setEditing(d)} className="inline-flex items-center gap-1 rounded-full border border-[#EAEAEA] px-3 py-1.5 text-[12px] mr-2 hover:bg-[#FAFAFA]">
                    <DollarSign className="h-3.5 w-3.5" strokeWidth={1.5} /> Prijzen
                  </button>
                  <button data-testid={`device-delete-${d.id}`} onClick={() => deleteDevice(d)} className="text-[#666666] hover:text-[#DC2626] p-2" aria-label="verwijderen"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-[#666666]">Nog geen toestellen voor dit merk.</td></tr>}
          </tbody>
        </table>
      </div>

      <PriceOverridesModal device={editing} onClose={() => setEditing(null)} />

      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl border border-[#EAEAEA] w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[16px] font-semibold">Toestel toevoegen</div>
                <button onClick={() => setCreating(false)} className="text-[#666666]"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Merk</label>
                  <select data-testid="add-device-brand" value={draft.brand_id} onChange={(e) => setDraft({ ...draft, brand_id: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]">
                    <option value="">— Kies —</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">Naam</label>
                  <input data-testid="add-device-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="bijv. iPhone 17" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-[13px]">
                    <input type="checkbox" checked={draft.popular} onChange={(e) => setDraft({ ...draft, popular: e.target.checked })} className="accent-[#111111] h-4 w-4" /> Populair
                  </label>
                  <div className="flex items-center gap-2 text-[13px]">
                    Volgorde <input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} className="rounded-lg border border-[#EAEAEA] px-2 py-1 w-20" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setCreating(false)} className="rounded-full border border-[#EAEAEA] px-4 py-2 text-[13px]">Annuleren</button>
                <button data-testid="add-device-save" onClick={createDevice} className="rounded-full bg-[#111111] text-white px-5 py-2 text-[13px] font-medium">Toevoegen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PriceOverridesModal({ device, onClose }) {
  const [repairs, setRepairs] = useState([]);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    if (!device) return;
    api.get("/admin/repairs").then((r) => setRepairs(r.data));
    api.get(`/admin/price-overrides?device_id=${device.id}`).then((r) => {
      const map = {};
      r.data.forEach((o) => (map[o.repair_id] = o.price_eur));
      setOverrides(map);
    });
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [device, onClose]);

  if (!device) return null;

  const save = async (repair_id, price_eur) => {
    if (price_eur === "" || price_eur === null || price_eur === undefined) {
      await api.delete(`/admin/price-overrides?device_id=${device.id}&repair_id=${repair_id}`);
      setOverrides((prev) => { const c = { ...prev }; delete c[repair_id]; return c; });
      toast.success("Standaardprijs hersteld");
    } else {
      await api.put(`/admin/price-overrides`, { device_id: device.id, repair_id, price_eur: Number(price_eur) });
      setOverrides((prev) => ({ ...prev, [repair_id]: Number(price_eur) }));
      toast.success("Opgeslagen");
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl border border-[#EAEAEA] w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-[#EAEAEA]">
            <div>
              <div className="text-[16px] font-semibold">Prijzen · {device.name}</div>
              <div className="text-[12px] text-[#666666] mt-0.5">Laat leeg voor standaardprijs. Bewaar automatisch bij afsluiten van veld.</div>
            </div>
            <button onClick={onClose} className="text-[#666666] hover:text-[#111111]"><X className="h-5 w-5" strokeWidth={1.5} /></button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="grid gap-2">
              {repairs.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#EAEAEA] last:border-0">
                  <div className="flex-1">
                    <div className="text-[14px] font-medium text-[#111111]">{r.name}</div>
                    <div className="text-[12px] text-[#666666]">Standaardprijs €{r.price_eur}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#666666]">€</span>
                    <input
                      data-testid={`price-${r.id}`}
                      type="number"
                      step="0.01"
                      defaultValue={overrides[r.id] ?? ""}
                      placeholder={String(r.price_eur)}
                      onBlur={(e) => {
                        const v = e.target.value;
                        const current = overrides[r.id];
                        if (v === "" && current === undefined) return;
                        if (Number(v) === current) return;
                        save(r.id, v);
                      }}
                      className="w-28 rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-[#EAEAEA] flex justify-end">
            <button onClick={onClose} className="rounded-full bg-[#111111] text-white px-5 py-2 text-[13px] font-medium inline-flex items-center gap-2">
              <Save className="h-4 w-4" strokeWidth={1.5} /> Klaar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
