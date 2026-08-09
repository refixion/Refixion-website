import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, MapPin, Store, Truck, User } from "lucide-react";
import { Section } from "../components/site/primitives";
import { api, formatApiErrorDetail } from "../lib/api";
import { getCart, clearCart } from "../lib/cart";

const FREE_SHIPPING_FROM = 50;
const SHIPPING_COST = 4.95;
const VAT_RATE = 0.21;

const STEPS = [
  { key: "personal", label: "Gegevens", icon: User },
  { key: "address", label: "Adres", icon: MapPin },
  { key: "shipping", label: "Verzending", icon: Truck },
  { key: "payment", label: "Betalen", icon: Check },
];

function formatPrice(price) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);
}

function lineTotal(item) {
  return (item.unitPrice + (item.optionsPrice || 0)) * item.quantity;
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-[12px] text-[#DC2626]">{error}</p>}
    </div>
  );
}

const inputClass = (hasError) =>
  `w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none focus:border-[#111111] ${hasError ? "border-[#DC2626]" : "border-[#EAEAEA]"}`;

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    street: "", house_number: "", postal_code: "", city: "", country: "Nederland",
    shipping_method: "shipping",
  });

  useEffect(() => {
    setItems(getCart());
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + lineTotal(i), 0), [items]);
  const shipping = form.shipping_method === "pickup" || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const vatPortion = total - total / (1 + VAT_RATE);

  const validateStep = (idx) => {
    const e = {};
    if (idx === 0) {
      if (!form.first_name.trim()) e.first_name = "Verplicht";
      if (!form.last_name.trim()) e.last_name = "Verplicht";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Ongeldig e-mailadres";
      if (!form.phone.trim()) e.phone = "Verplicht";
    }
    if (idx === 1 && form.shipping_method !== "pickup") {
      if (!form.street.trim()) e.street = "Verplicht";
      if (!form.house_number.trim()) e.house_number = "Verplicht";
      if (!/^[0-9]{4}\s?[A-Za-z]{2}$/.test(form.postal_code.trim())) e.postal_code = "Ongeldige postcode (bijv. 1234 AB)";
      if (!form.city.trim()) e.city = "Verplicht";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));


  const placeOrder = async () => {
  setSubmitting(true);

  try {
    const paymentItems = items.map((i) => ({
      product_id: i.productId,
      quantity: Number(i.quantity),
      option_ids: i.optionIds || [],
    }));

    console.log("=== STRIPE CHECKOUT DEBUG ===");
    console.log("Original cart:", items);
    console.log("Payment items:", paymentItems);
    console.log(
      "JSON:",
      JSON.stringify({
        ...form,
        items: paymentItems,
      })
    );

    const res = await api.post("/payments/create-checkout-session", {
      ...form,
      items: paymentItems,
    });

    window.location.href = res.data.url;
  } catch (e) {
    console.error("CHECKOUT ERROR:", e);
    console.error("SERVER RESPONSE:", e?.response?.data);

    toast.error(
      formatApiErrorDetail(e?.response?.data?.detail) ||
      "Betaling starten mislukt. Probeer het opnieuw."
    );
  } finally {
    setSubmitting(false);
  }
};



  // ------- Bevestiging -------
  if (placedOrder) {
    return (
      <Section>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="h-14 w-14 rounded-full bg-[#111111] flex items-center justify-center mx-auto">
            <Check className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#111111]">Bedankt voor je bestelling!</h1>
          <p className="mt-2 text-[14px] text-[#666666]">
            Ordernummer <span className="font-medium text-[#111111]">{placedOrder.order_number}</span>
          </p>
          <div className="mt-8 rounded-2xl border border-[#EAEAEA] p-6 text-left">
            {placedOrder.items.map((it, i) => (
              <div key={i} className="flex justify-between text-[14px] py-1.5">
                <span className="text-[#666666]">{it.quantity}× {it.product_title}</span>
                <span className="text-[#111111]">{formatPrice(it.line_total)}</span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-[#EAEAEA] flex justify-between font-semibold text-[#111111]">
              <span>Totaal</span>
              <span>{formatPrice(placedOrder.total_price)}</span>
            </div>
          </div>
          <p className="mt-6 text-[13px] text-[#999999]">
            We nemen contact met je op over de betaling — online afrekenen volgt binnenkort.
          </p>
          <Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]">
            Verder winkelen
          </Link>
        </div>
      </Section>
    );
  }

  if (items.length === 0) {
    return (
      <Section>
        <div className="text-center py-20">
          <div className="text-[18px] font-medium text-[#111111]">Je winkelwagen is leeg.</div>
          <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]">
            Naar de shop
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <div className="bg-white">
      <Section>
        <Link to="/cart" className="inline-flex items-center gap-2 text-[14px] text-[#666666] hover:text-[#111111]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Terug naar winkelwagen
        </Link>

        <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">Afrekenen.</h1>

        {/* Stappen-indicator */}
        <div className="mt-8 flex items-center gap-2 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium ${
                  i < step ? "bg-[#111111] text-white" : i === step ? "border-2 border-[#111111] text-[#111111]" : "border border-[#EAEAEA] text-[#999999]"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : i + 1}
              </div>
              <span className={`text-[13px] ${i === step ? "text-[#111111] font-medium" : "text-[#999999]"}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-[#EAEAEA] mx-1" />}
            </div>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-10">
          {/* Stap-content */}
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Voornaam *" error={errors.first_name}>
                    <input value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} className={inputClass(errors.first_name)} />
                  </Field>
                  <Field label="Achternaam *" error={errors.last_name}>
                    <input value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} className={inputClass(errors.last_name)} />
                  </Field>
                </div>
                <Field label="E-mail *" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={inputClass(errors.email)} />
                </Field>
                <Field label="Telefoon *" error={errors.phone}>
                  <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} className={inputClass(errors.phone)} />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                {form.shipping_method === "pickup" ? (
                  <div className="rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] p-4 text-[14px] text-[#666666]">
                    Je haalt je bestelling op bij Refixion — een adres is dan niet nodig. Ga naar de volgende stap.
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-[1fr_auto] gap-4">
                      <Field label="Straat *" error={errors.street}>
                        <input value={form.street} onChange={(e) => set({ street: e.target.value })} className={inputClass(errors.street)} />
                      </Field>
                      <Field label="Huisnummer *" error={errors.house_number}>
                        <input value={form.house_number} onChange={(e) => set({ house_number: e.target.value })} className={`${inputClass(errors.house_number)} sm:w-28`} />
                      </Field>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Postcode *" error={errors.postal_code}>
                        <input value={form.postal_code} onChange={(e) => set({ postal_code: e.target.value })} placeholder="1234 AB" className={inputClass(errors.postal_code)} />
                      </Field>
                      <Field label="Plaats *" error={errors.city}>
                        <input value={form.city} onChange={(e) => set({ city: e.target.value })} className={inputClass(errors.city)} />
                      </Field>
                    </div>
                    <Field label="Land">
                      <input value={form.country} onChange={(e) => set({ country: e.target.value })} className={inputClass(false)} />
                    </Field>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <button
                  onClick={() => set({ shipping_method: "shipping" })}
                  className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left ${form.shipping_method === "shipping" ? "border-[#111111]" : "border-[#EAEAEA]"}`}
                >
                  <Truck className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                  <div className="flex-1">
                    <div className="text-[14px] font-medium text-[#111111]">Verzenden</div>
                    <div className="text-[13px] text-[#666666]">Bezorgd op je adres · {subtotal >= FREE_SHIPPING_FROM ? "gratis" : formatPrice(SHIPPING_COST)}</div>
                  </div>
                </button>
                <button
                  onClick={() => set({ shipping_method: "pickup" })}
                  className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left ${form.shipping_method === "pickup" ? "border-[#111111]" : "border-[#EAEAEA]"}`}
                >
                  <Store className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
                  <div className="flex-1">
                    <div className="text-[14px] font-medium text-[#111111]">Ophalen</div>
                    <div className="text-[13px] text-[#666666]">Bij Refixion ophalen · gratis</div>
                  </div>
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="rounded-xl border border-[#EAEAEA] p-5">
                <div className="text-[14px] font-medium text-[#111111]">
                  Online betalen
                </div>

                <p className="mt-1 text-[13px] text-[#666666]">
                  Je wordt doorgestuurd naar Stripe om je bestelling veilig af te rekenen
                  met iDEAL of creditcard.
                </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              {step > 0 && (
                <button onClick={goBack} className="rounded-full border border-[#EAEAEA] px-6 py-3 text-[14px] font-medium hover:bg-[#FAFAFA]">
                  Vorige
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={goNext} className="flex-1 sm:flex-none rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]">
                  Volgende
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  data-testid="place-order-btn"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333] disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                  Naar betaling
                </button>
              )}
            </div>
          </div>

          {/* Overzicht */}
          <div>
            <div className="rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] p-6 sticky top-24">
              <div className="text-[15px] font-semibold text-[#111111] mb-4">Besteloverzicht</div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[13px]">
                    <span className="text-[#666666]">{item.quantity}× {item.title}</span>
                    <span className="text-[#111111]">{formatPrice(lineTotal(item))}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#EAEAEA] space-y-2 text-[14px]">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotaal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Verzendkosten</span>
                  <span>{shipping === 0 ? "Gratis" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999999]">
                  <span>Waarvan {Math.round(VAT_RATE * 100)}% btw</span>
                  <span>{formatPrice(vatPortion)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#EAEAEA] flex justify-between items-baseline">
                <span className="text-[15px] font-medium text-[#111111]">Totaal</span>
                <span className="text-[20px] font-semibold text-[#111111]">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
