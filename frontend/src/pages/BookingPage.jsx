import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Store, Package, Truck, Briefcase, ChevronDown, Info } from "lucide-react";
import * as Lucide from "lucide-react";
import { SiApple, SiSamsung, SiGoogle, SiOneplus } from "react-icons/si";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";
import { useBooking } from "../lib/booking-store";

const BRAND_ICONS = { apple: SiApple, samsung: SiSamsung, google: SiGoogle, oneplus: SiOneplus };
const METHOD_ICONS = { store: Store, package: Package, truck: Truck, briefcase: Briefcase };

function StepIndicator({ step, total = 7 }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[12px] text-[#666666] mb-2">
        <span>Stap {step} van {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1 bg-[#EAEAEA] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#111111]"
          initial={false}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}

function StepShell({ children, title, subtitle, onNext, onBack, canNext, nextLabel = "Volgende", loading = false }) {
  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl md:text-4xl tracking-tight font-semibold text-[#111111]">{title}</h1>
          {subtitle && <p className="mt-3 text-[15px] md:text-[17px] text-[#666666]">{subtitle}</p>}
          <div className="mt-10">{children}</div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-12 flex items-center justify-between">
        <button
          data-testid="wizard-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[14px] text-[#666666] hover:text-[#111111] disabled:opacity-40"
          disabled={!onBack}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Terug
        </button>
        <motion.button
          data-testid="wizard-next-btn"
          whileHover={canNext && !loading ? { scale: 1.02 } : {}}
          whileTap={canNext && !loading ? { scale: 0.98 } : {}}
          onClick={onNext}
          disabled={!canNext || loading}
          className="inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-7 py-3.5 text-[15px] font-medium disabled:bg-[#EAEAEA] disabled:text-[#666666] hover:bg-[#333] transition-colors"
        >
          {loading ? "Bezig..." : nextLabel} {!loading && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
        </motion.button>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { state, update, reset } = useBooking();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [brands, setBrands] = useState([]);
  const [devices, setDevices] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [methods, setMethods] = useState([]);
  const [availability, setAvailability] = useState({ slots: [], loading: false });
  const [searchDev, setSearchDev] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step = state.step || 1;

  // Load brands on mount
  useEffect(() => {
    api.get("/brands").then((r) => setBrands(r.data));
    api.get("/repair-methods").then((r) => setMethods(r.data));
  }, []);

  // Handle url pre-selection
  useEffect(() => {
    const brandSlug = params.get("brand");
    const deviceId = params.get("device");
    if (brandSlug && brands.length && !state.brand) {
      const b = brands.find((x) => x.slug === brandSlug);
      if (b) update({ brand: b, step: deviceId ? 3 : 2 });
    }
    if (deviceId && brands.length) {
      api.get(`/devices?brand_id=${brands.find((x) => x.slug === brandSlug)?.id || ""}`).then((r) => {
        const d = r.data.find((x) => x.id === deviceId);
        if (d) update({ device: d, step: 3 });
      });
    }
    // eslint-disable-next-line
  }, [brands]);

  // Load devices when brand set
  useEffect(() => {
    if (state.brand?.id) {
      api.get(`/devices?brand_id=${state.brand.id}${searchDev ? `&q=${encodeURIComponent(searchDev)}` : ""}`).then((r) => setDevices(r.data));
    }
  }, [state.brand, searchDev]);

  // Load repairs when device set
  useEffect(() => {
    if (state.device?.id) {
      api.get(`/repairs?device_id=${state.device.id}`).then((r) => setRepairs(r.data));
    }
  }, [state.device]);

  // Load availability when date changes
  useEffect(() => {
    if (state.date && step === 5) {
      setAvailability({ slots: [], loading: true });
      api.get(`/availability?date=${state.date}`).then((r) => setAvailability({ slots: r.data.slots || [], closed: r.data.closed, full: r.data.full, loading: false }));
    }
  }, [state.date, step]);

  const setStep = (n) => update({ step: n });

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!state.brand;
      case 2: return !!state.device;
      case 3: return !!state.repair;
      case 4: return !!state.method;
      case 5: return !!state.date && !!state.time;
      case 6: {
        const c = state.customer;
        return c.first_name && c.last_name && /\S+@\S+\.\S+/.test(c.email) && /^(\+?31|0)[\d\s-]{8,}$/.test(c.phone.replace(/\s/g, "")) && c.street && c.house_number && c.postal_code && c.city && c.consent;
      }
      case 7: return true;
      default: return false;
    }
  }, [step, state]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        brand_id: state.brand.id,
        device_id: state.device.id,
        repair_id: state.repair.id,
        method_id: state.method.id,
        appointment_date: state.date,
        appointment_time: state.time,
        ...state.customer,
      };
      const r = await api.post("/bookings", payload);
      const ref = r.data.reference;
      reset();
      navigate(`/booking/success?ref=${ref}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Boeking mislukt");
    } finally { setSubmitting(false); }
  };

  // Date grid: next 30 days
  const dates = useMemo(() => {
    const today = new Date();
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container-page py-10">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" data-testid="wizard-home-link" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#111111] flex items-center justify-center">
              <span className="text-white text-[13px] font-semibold">R</span>
            </div>
            <span className="text-[16px] font-semibold tracking-tight">Refixion</span>
          </Link>
          <button data-testid="wizard-cancel-btn" onClick={() => { if (window.confirm("Boeking annuleren?")) { reset(); navigate("/"); } }} className="text-[13px] text-[#666666] hover:text-[#111111]">Annuleren</button>
        </div>

        <div className="max-w-4xl mx-auto mb-10">
          <StepIndicator step={step} />
        </div>

        {/* Step 1: Brand */}
        {step === 1 && (
          <StepShell title="Kies je merk." subtitle="Voor welk merk hebben wij vandaag mogen zorgen?" onNext={() => setStep(2)} canNext={canNext}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {brands.map((b) => {
                const Icon = BRAND_ICONS[b.slug];
                const selected = state.brand?.id === b.id;
                return (
                  <motion.button
                    key={b.id}
                    data-testid={`wizard-brand-${b.slug}`}
                    whileHover={{ y: -2 }}
                    onClick={() => update({ brand: b, device: null, repair: null })}
                    className={`text-left rounded-2xl border p-6 bg-white transition-all ${selected ? "border-[#111111] shadow-[0_8px_30px_rgb(0,0,0,0.08)]" : "border-[#EAEAEA] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"}`}
                  >
                    {Icon && <Icon className="h-7 w-7 text-[#111111]" />}
                    <div className="mt-5 text-[16px] font-medium text-[#111111]">{b.name}</div>
                    {selected && <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-[#111111]"><Check className="h-3.5 w-3.5" strokeWidth={2} />Geselecteerd</div>}
                  </motion.button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* Step 2: Device */}
        {step === 2 && (
          <StepShell title="Kies je toestel." subtitle={state.brand?.name} onBack={() => setStep(1)} onNext={() => setStep(3)} canNext={canNext}>
            <input
              data-testid="wizard-device-search"
              value={searchDev}
              onChange={(e) => setSearchDev(e.target.value)}
              placeholder="Zoek je model..."
              className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111] mb-4"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {devices.map((d) => {
                const selected = state.device?.id === d.id;
                return (
                  <button
                    key={d.id}
                    data-testid={`wizard-device-${d.id}`}
                    onClick={() => update({ device: d, repair: null })}
                    className={`text-left rounded-2xl border p-4 bg-white transition-all ${selected ? "border-[#111111]" : "border-[#EAEAEA] hover:border-[#666666]"}`}
                  >
                    <div className="text-[14px] font-medium text-[#111111]">{d.name}</div>
                    {d.popular && <div className="text-[11px] text-[#666666] mt-1">Populair</div>}
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* Step 3: Repair */}
        {step === 3 && (
          <StepShell title="Wat willen we repareren?" subtitle={`${state.brand?.name} ${state.device?.name}`} onBack={() => setStep(2)} onNext={() => setStep(4)} canNext={canNext}>
            <div className="grid md:grid-cols-2 gap-3">
              {repairs.map((r) => {
                const iconName = (r.icon || "smartphone").split("-").map((s, i) => i === 0 ? s : s[0].toUpperCase() + s.slice(1)).join("");
                const IconComp = Lucide[iconName[0].toUpperCase() + iconName.slice(1)] || Lucide.Smartphone;
                const selected = state.repair?.id === r.id;
                return (
                  <motion.button
                    key={r.id}
                    data-testid={`wizard-repair-${r.id}`}
                    whileHover={{ y: -2 }}
                    onClick={() => update({ repair: r })}
                    className={`text-left rounded-2xl border p-6 bg-white transition-all ${selected ? "border-[#111111] shadow-[0_8px_30px_rgb(0,0,0,0.08)]" : "border-[#EAEAEA] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"}`}
                  >
                    <div className="flex items-start justify-between">
                      <IconComp className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                      <div className="text-[16px] font-semibold text-[#111111]">€{r.price_eur}</div>
                    </div>
                    <div className="mt-5 text-[16px] font-medium text-[#111111]">{r.name}</div>
                    <div className="mt-1 text-[13px] text-[#666666] leading-relaxed">{r.description}</div>
                    <div className="mt-4 flex items-center gap-4 text-[12px] text-[#666666]">
                      <span>~ {r.duration_minutes} min</span>
                      <span>·</span>
                      <span>{r.warranty}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* Step 4: Method */}
        {step === 4 && (
          <StepShell title="Hoe wil je repareren?" subtitle="Kies de methode die het beste bij je past." onBack={() => setStep(3)} onNext={() => setStep(5)} canNext={canNext}>
            <div className="grid md:grid-cols-2 gap-3">
              {methods.map((m) => {
                const Icon = METHOD_ICONS[m.icon] || Store;
                const selected = state.method?.id === m.id;
                return (
                  <motion.button
                    key={m.id}
                    data-testid={`wizard-method-${m.slug}`}
                    whileHover={{ y: -2 }}
                    onClick={() => update({ method: m })}
                    className={`text-left rounded-2xl border p-6 bg-white transition-all ${selected ? "border-[#111111] shadow-[0_8px_30px_rgb(0,0,0,0.08)]" : "border-[#EAEAEA] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"}`}
                  >
                    <Icon className="h-6 w-6 text-[#111111]" strokeWidth={1.5} />
                    <div className="mt-5 text-[16px] font-medium text-[#111111]">{m.title}</div>
                    <div className="mt-1 text-[13px] text-[#666666] leading-relaxed">{m.description}</div>
                    <div className="mt-4 flex items-center gap-4 text-[12px] text-[#666666]">
                      <span>{m.estimated_turnaround}</span>
                      {m.additional_price > 0 && <><span>·</span><span>+ €{m.additional_price}</span></>}
                    </div>
                    {m.info && <div className="mt-4 inline-flex items-start gap-2 text-[12px] text-[#666666]"><Info className="h-3.5 w-3.5 mt-0.5" strokeWidth={1.5} />{m.info}</div>}
                  </motion.button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* Step 5: Date & Time */}
        {step === 5 && (
          <StepShell title="Kies datum en tijd." subtitle="Selecteer wanneer het je uitkomt." onBack={() => setStep(4)} onNext={() => setStep(6)} canNext={canNext}>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-[12px] uppercase tracking-wider text-[#666666] mb-3">Datum</div>
                <div className="grid grid-cols-4 gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {dates.map((d) => {
                    const iso = d.toISOString().slice(0, 10);
                    const sel = state.date === iso;
                    return (
                      <button
                        key={iso}
                        data-testid={`wizard-date-${iso}`}
                        onClick={() => update({ date: iso, time: null })}
                        className={`rounded-2xl border p-3 text-left transition-colors ${sel ? "border-[#111111] bg-[#111111] text-white" : "border-[#EAEAEA] bg-white text-[#111111] hover:border-[#666666]"}`}
                      >
                        <div className={`text-[11px] uppercase ${sel ? "text-white/70" : "text-[#666666]"}`}>{d.toLocaleDateString("nl-NL", { weekday: "short" })}</div>
                        <div className="text-[18px] font-semibold mt-0.5">{d.getDate()}</div>
                        <div className={`text-[11px] ${sel ? "text-white/70" : "text-[#666666]"}`}>{d.toLocaleDateString("nl-NL", { month: "short" })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-wider text-[#666666] mb-3">Tijd</div>
                {!state.date && <div className="text-[14px] text-[#666666]">Selecteer eerst een datum.</div>}
                {state.date && availability.loading && <div className="text-[14px] text-[#666666]">Laden...</div>}
                {state.date && !availability.loading && availability.slots.length === 0 && (
                  <div className="text-[14px] text-[#666666]">{availability.closed ? "Gesloten op deze dag." : availability.full ? "Volgeboekt." : "Geen tijden beschikbaar."}</div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {availability.slots.map((slot) => {
                    const sel = state.time === slot;
                    return (
                      <button
                        key={slot}
                        data-testid={`wizard-time-${slot}`}
                        onClick={() => update({ time: slot })}
                        className={`rounded-full border py-2.5 text-[13px] transition-colors ${sel ? "border-[#111111] bg-[#111111] text-white" : "border-[#EAEAEA] bg-white text-[#111111] hover:border-[#666666]"}`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </StepShell>
        )}

        {/* Step 6: Customer */}
        {step === 6 && (
          <StepShell title="Jouw gegevens." subtitle="We gebruiken deze om je op de hoogte te houden." onBack={() => setStep(5)} onNext={() => setStep(7)} canNext={canNext}>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { k: "first_name", label: "Voornaam" },
                { k: "last_name", label: "Achternaam" },
                { k: "email", label: "E-mailadres", type: "email" },
                { k: "phone", label: "Telefoonnummer", placeholder: "+31 6 12345678" },
                { k: "street", label: "Straat" },
                { k: "house_number", label: "Huisnummer" },
                { k: "postal_code", label: "Postcode" },
                { k: "city", label: "Plaats" },
              ].map((f) => (
                <div key={f.k}>
                  <label className="text-[12px] uppercase tracking-wider text-[#666666] block mb-2">{f.label}</label>
                  <input
                    data-testid={`wizard-input-${f.k}`}
                    type={f.type || "text"}
                    value={state.customer[f.k]}
                    placeholder={f.placeholder}
                    onChange={(e) => update({ customer: { ...state.customer, [f.k]: e.target.value } })}
                    className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111]"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-[12px] uppercase tracking-wider text-[#666666] block mb-2">Notities (optioneel)</label>
                <textarea
                  data-testid="wizard-input-notes"
                  value={state.customer.notes}
                  onChange={(e) => update({ customer: { ...state.customer, notes: e.target.value } })}
                  rows={3}
                  className="w-full rounded-2xl border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-[#111111]"
                />
              </div>
              <label className="md:col-span-2 flex items-start gap-3 text-[14px] text-[#111111] cursor-pointer">
                <input
                  data-testid="wizard-consent"
                  type="checkbox"
                  checked={state.customer.consent}
                  onChange={(e) => update({ customer: { ...state.customer, consent: e.target.checked } })}
                  className="mt-1 h-4 w-4 accent-[#111111]"
                />
                <span>Ik ga akkoord met de <Link to="/legal/terms" className="underline">Algemene voorwaarden</Link> en het <Link to="/legal/privacy" className="underline">Privacybeleid</Link>.</span>
              </label>
            </div>
          </StepShell>
        )}

        {/* Step 7: Confirm */}
        {step === 7 && (
          <StepShell title="Alles klopt?" subtitle="Controleer je boeking voordat je bevestigt." onBack={() => setStep(6)} onNext={submit} canNext={canNext} nextLabel="Bevestig boeking" loading={submitting}>
            <div className="rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] p-6 md:p-8 space-y-4">
              {[
                ["Merk", state.brand?.name],
                ["Toestel", state.device?.name],
                ["Reparatie", state.repair?.name],
                ["Methode", state.method?.title],
                ["Datum", state.date],
                ["Tijd", state.time],
                ["Geschatte duur", `${state.repair?.duration_minutes} min`],
                ["Prijs", `€${(Number(state.repair?.price_eur || 0) + Number(state.method?.additional_price || 0)).toFixed(2)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[14px] border-b border-[#EAEAEA] pb-3 last:border-0 last:pb-0">
                  <span className="text-[#666666]">{k}</span>
                  <span className="text-[#111111] font-medium">{v}</span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-[#EAEAEA]">
                <div className="text-[12px] uppercase tracking-wider text-[#666666] mb-2">Klantgegevens</div>
                <div className="text-[14px] text-[#111111]">{state.customer.first_name} {state.customer.last_name}</div>
                <div className="text-[13px] text-[#666666]">{state.customer.email} · {state.customer.phone}</div>
                <div className="text-[13px] text-[#666666]">{state.customer.street} {state.customer.house_number}, {state.customer.postal_code} {state.customer.city}</div>
                {state.customer.notes && <div className="text-[13px] text-[#666666] mt-2 italic">"{state.customer.notes}"</div>}
              </div>
            </div>
          </StepShell>
        )}
      </div>
    </div>
  );
}
