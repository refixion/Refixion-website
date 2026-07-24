import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../../lib/api";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Plus, Save, Settings2, Trash2, X } from "lucide-react";

const EMPTY_DRAFT = {
  title: "", slug: "", brand: "", model: "", storage: "", color: "",
  battery_health: 100, condition: "", description: "", price: "",
  stock: 1, warranty_months: 12, featured: false, enabled: true,
  images: [], options: [],
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null); // null = closed, {} = create, {...} = edit

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/shop/admin/products");
      setProducts(r.data);
    } catch (e) {
      toast.error("Kon producten niet laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patchProduct = async (p, patch) => {
    try {
      await api.put(`/shop/products/${p.id}`, patch);
      setProducts((cur) => cur.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
      load();
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Product "${p.title}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    try {
      await api.delete(`/shop/products/${p.id}`);
      toast.success("Verwijderd");
      setProducts((cur) => cur.filter((x) => x.id !== p.id));
    } catch (e) {
      toast.error("Verwijderen mislukt");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="text-3xl tracking-tight font-semibold">Shop.</h1>
        <button
          data-testid="admin-product-add"
          onClick={() => setModalProduct({ ...EMPTY_DRAFT })}
          className="rounded-full bg-[#111111] text-white px-5 py-2.5 text-[13px] font-medium inline-flex items-center gap-2 hover:bg-[#333]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Product toevoegen
        </button>
      </div>
      <p className="text-[14px] text-[#666666]">Beheer refurbished toestellen, voorraad en extra opties.</p>

      <div className="mt-6 rounded-2xl bg-white border border-[#EAEAEA] overflow-hidden overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-[#FAFAFA] text-left text-[#666666]">
            <tr>
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium">Titel</th>
              <th className="px-4 py-3 font-medium">Prijs</th>
              <th className="px-4 py-3 font-medium">Voorraad</th>
              <th className="px-4 py-3 font-medium">Uitgelicht</th>
              <th className="px-4 py-3 font-medium">Actief</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-[#EAEAEA]">
                <td className="px-4 py-3">
                  <div className="h-10 w-10 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] overflow-hidden flex items-center justify-center">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-[#CCCCCC]" strokeWidth={1.5} />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[#111111]">{p.title}</div>
                  <div className="text-[12px] text-[#666666]">{p.brand} · {p.model} · {p.storage} · {p.color}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[#666666]">€</span>
                    <input
                      data-testid={`product-price-${p.id}`}
                      type="number" step="0.01" defaultValue={p.price}
                      onBlur={(e) => Number(e.target.value) !== p.price && patchProduct(p, { price: Number(e.target.value) })}
                      className="w-24 rounded-lg border border-transparent hover:border-[#EAEAEA] focus:border-[#111111] outline-none px-2 py-1"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    data-testid={`product-stock-${p.id}`}
                    type="number" defaultValue={p.stock}
                    onBlur={(e) => Number(e.target.value) !== p.stock && patchProduct(p, { stock: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-transparent hover:border-[#EAEAEA] focus:border-[#111111] outline-none px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox" data-testid={`product-featured-${p.id}`}
                    checked={!!p.featured}
                    onChange={(e) => patchProduct(p, { featured: e.target.checked })}
                    className="accent-[#111111] h-4 w-4"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox" data-testid={`product-enabled-${p.id}`}
                    checked={p.enabled !== false}
                    onChange={(e) => patchProduct(p, { enabled: e.target.checked })}
                    className="accent-[#111111] h-4 w-4"
                  />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    data-testid={`product-edit-${p.id}`}
                    onClick={() => setModalProduct({ ...EMPTY_DRAFT, ...p, options: p.options || [] })}
                    className="inline-flex items-center gap-1 rounded-full border border-[#EAEAEA] px-3 py-1.5 text-[12px] mr-2 hover:bg-[#FAFAFA]"
                  >
                    <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Bewerken
                  </button>
                  <button
                    data-testid={`product-delete-${p.id}`}
                    onClick={() => deleteProduct(p)}
                    className="text-[#666666] hover:text-[#DC2626] p-2"
                    aria-label="verwijderen"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#666666]">Nog geen producten. Klik op "Product toevoegen".</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductModal
        draft={modalProduct}
        onClose={() => setModalProduct(null)}
        onSaved={() => { setModalProduct(null); load(); }}
      />
    </div>
  );
}

function ProductModal({ draft, onClose, onSaved }) {
  const [form, setForm] = useState(draft || EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newOption, setNewOption] = useState({ name: "", price: "" });

  useEffect(() => { if (draft) setForm(draft); }, [draft]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!draft) return null;
  const isEdit = !!draft.id;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    set({ images: [...(form.images || []), newImageUrl.trim()] });
    setNewImageUrl("");
  };
  const removeImage = (idx) => set({ images: form.images.filter((_, i) => i !== idx) });

  const addOption = () => {
    if (!newOption.name.trim() || newOption.price === "") return;
    set({ options: [...(form.options || []), { name: newOption.name.trim(), price: Number(newOption.price), enabled: true }] });
    setNewOption({ name: "", price: "" });
  };
  const removeOption = (idx) => set({ options: form.options.filter((_, i) => i !== idx) });

  const save = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.brand.trim() || !form.model.trim() || !form.storage.trim() || !form.color.trim() || !form.condition.trim() || form.price === "") {
      toast.error("Vul alle verplichte velden in (titel, slug, merk, model, opslag, kleur, conditie, prijs)");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title, slug: form.slug, brand: form.brand, model: form.model,
      storage: form.storage, color: form.color, condition: form.condition,
      battery_health: Number(form.battery_health) || 0,
      description: form.description || "",
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      warranty_months: Number(form.warranty_months) || 0,
      featured: !!form.featured,
      enabled: !!form.enabled,
      images: form.images || [],
      options: (form.options || []).map((o) => ({ name: o.name, price: Number(o.price), enabled: o.enabled !== false })),
    };
    try {
      if (isEdit) {
        await api.put(`/shop/products/${form.id}`, payload);
      } else {
        await api.post("/shop/products", payload);
      }
      toast.success("Opgeslagen");
      onSaved();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl border border-[#EAEAEA] w-full max-w-2xl max-h-[88vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-[#EAEAEA]">
            <div className="text-[16px] font-semibold">{isEdit ? `Bewerken · ${draft.title}` : "Product toevoegen"}</div>
            <button onClick={onClose} className="text-[#666666] hover:text-[#111111]"><X className="h-5 w-5" strokeWidth={1.5} /></button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Basisgegevens */}
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Titel *">
                <input
                  data-testid="product-form-title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    set({ title, slug: isEdit ? form.slug : slugify(title) });
                  }}
                  className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]"
                  placeholder="bijv. iPhone 12 128GB Zwart"
                />
              </Field>
              <Field label="Slug *">
                <input data-testid="product-form-slug" value={form.slug} onChange={(e) => set({ slug: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
              </Field>
              <Field label="Merk *">
                <input value={form.brand} onChange={(e) => set({ brand: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="Apple" />
              </Field>
              <Field label="Model *">
                <input value={form.model} onChange={(e) => set({ model: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="iPhone 12" />
              </Field>
              <Field label="Opslag *">
                <input value={form.storage} onChange={(e) => set({ storage: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="128GB" />
              </Field>
              <Field label="Kleur *">
                <input value={form.color} onChange={(e) => set({ color: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="Zwart" />
              </Field>
              <Field label="Conditie *">
                <input value={form.condition} onChange={(e) => set({ condition: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" placeholder="Goed / Zo goed als nieuw" />
              </Field>
              <Field label="Batterij %">
                <input type="number" min="0" max="100" value={form.battery_health} onChange={(e) => set({ battery_health: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
              </Field>
              <Field label="Prijs (€) *">
                <input type="number" step="0.01" value={form.price} onChange={(e) => set({ price: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
              </Field>
              <Field label="Voorraad">
                <input type="number" value={form.stock} onChange={(e) => set({ stock: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
              </Field>
              <Field label="Garantie (maanden)">
                <input type="number" value={form.warranty_months} onChange={(e) => set({ warranty_months: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
              </Field>
              <div className="flex items-center gap-4 pt-6">
                <label className="inline-flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="accent-[#111111] h-4 w-4" /> Uitgelicht
                </label>
                <label className="inline-flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="accent-[#111111] h-4 w-4" /> Actief
                </label>
              </div>
            </div>

            <Field label="Beschrijving">
              <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={3} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]" />
            </Field>

            {/* Foto's */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-2">Foto's (URL's)</label>
              <div className="flex gap-2">
                <input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]"
                />
                <button onClick={addImage} className="rounded-xl border border-[#EAEAEA] px-4 py-2 text-[13px] hover:bg-[#FAFAFA]">Toevoegen</button>
              </div>
              {form.images?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-[#EAEAEA]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-[#999999]">Upload de foto naar bijv. Supabase Storage of Imgur en plak hier de directe afbeeldings-URL.</p>
            </div>

            {/* Opties */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-2">Extra opties</label>
              <div className="flex gap-2">
                <input
                  value={newOption.name}
                  onChange={(e) => setNewOption((o) => ({ ...o, name: e.target.value }))}
                  placeholder="bijv. Screenprotector"
                  className="flex-1 rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[#666666] text-[13px]">€</span>
                  <input
                    type="number" step="0.01"
                    value={newOption.price}
                    onChange={(e) => setNewOption((o) => ({ ...o, price: e.target.value }))}
                    className="w-24 rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px]"
                  />
                </div>
                <button onClick={addOption} className="rounded-xl border border-[#EAEAEA] px-4 py-2 text-[13px] hover:bg-[#FAFAFA]">Toevoegen</button>
              </div>
              {form.options?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.options.map((o, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-[#FAFAFA] px-3 py-2 text-[13px]">
                      <span>{o.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#666666]">€{Number(o.price).toFixed(2)}</span>
                        <button onClick={() => removeOption(i)} className="text-[#666666] hover:text-[#DC2626]"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-[#EAEAEA] flex justify-end gap-2">
            <button onClick={onClose} className="rounded-full border border-[#EAEAEA] px-4 py-2 text-[13px]">Annuleren</button>
            <button
              data-testid="product-form-save"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[#111111] text-white px-5 py-2 text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} /> Opslaan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">{label}</label>
      {children}
    </div>
  );
}
