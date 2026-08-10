import React, { useEffect, useState } from "react";
import { Mail, MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Section } from "../components/site/primitives";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function ReturnsPage() {
  const [ws, setWs] = useState(null);

  const [form, setForm] = useState({
    order_number: "",
    first_name: "",
    last_name: "",
    email: "",
    product: "",
    order_date: "",
    declaration: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/workshop")
      .then((res) => setWs(res.data))
      .catch(() => {});
  }, []);

  const set = (patch) => {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  };

  const submitReturn = async (e) => {
    e.preventDefault();

    if (!form.order_number.trim()) {
      toast.error("Vul je ordernummer in.");
      return;
    }

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Vul je voor- en achternaam in.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Vul je e-mailadres in.");
      return;
    }

    if (!form.product.trim()) {
      toast.error("Vul in welk product je wilt retourneren.");
      return;
    }

    if (!form.declaration) {
      toast.error("Bevestig dat je de aankoop wilt herroepen.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/shop/returns", {
        order_number: form.order_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        product: form.product.trim(),
        order_date: form.order_date || null,
      });

      setSubmitted(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          "Het formulier kon niet worden verzonden. Neem contact op via info@refixion.nl."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <Section>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[14px] text-[#666666] hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Terug naar de shop
        </Link>

        <div className="max-w-3xl mt-8">
          <div className="text-[12px] uppercase tracking-wider text-[#666666]">
            Refixion · Shop
          </div>

          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">
            Retourneren & herroepen
          </h1>

          <p className="mt-4 text-[15px] leading-7 text-[#666666]">
            Heb je online een refurbished telefoon bij Refixion gekocht?
            Als consument heb je in principe 14 dagen bedenktijd nadat je
            het product hebt ontvangen. Op deze pagina lees je hoe je een
            aankoop kunt herroepen en retourneren.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <section>
              <h2 className="text-[18px] font-semibold text-[#111111]">
                14 dagen bedenktijd
              </h2>

              <p className="mt-3 text-[14px] leading-6 text-[#666666]">
                Je kunt een online aankoop binnen 14 dagen na ontvangst
                herroepen zonder dat je daarvoor een reden hoeft op te geven.
                Laat ons binnen deze termijn weten dat je van de aankoop
                afziet.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#111111]">
                Hoe werkt retourneren?
              </h2>

              <ol className="mt-3 space-y-3 text-[14px] leading-6 text-[#666666]">
                <li>
                  <strong className="text-[#111111]">1.</strong> Meld je
                  herroeping via het formulier op deze pagina of per e-mail
                  via info@refixion.nl.
                </li>

                <li>
                  <strong className="text-[#111111]">2.</strong> Vermeld
                  daarbij je ordernummer en welk product je wilt retourneren.
                </li>

                <li>
                  <strong className="text-[#111111]">3.</strong> Stuur het
                  toestel vervolgens binnen de daarvoor geldende termijn
                  terug naar het retouradres van Refixion.
                </li>

                <li>
                  <strong className="text-[#111111]">4.</strong> Na ontvangst
                  en controle verwerken we de terugbetaling.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#111111]">
                Retouradres
              </h2>

              {ws ? (
                <div className="mt-3 flex items-start gap-3 text-[14px] text-[#666666]">
                  <MapPin
                    className="h-5 w-5 shrink-0 text-[#111111]"
                    strokeWidth={1.5}
                  />

                  <div>
                    <div className="font-medium text-[#111111]">
                      {ws.business_name || "Refixion"}
                    </div>

                    <div>
                      {ws.address}
                      {ws.postal_code ? `, ${ws.postal_code}` : ""}
                      {ws.city ? `, ${ws.city}` : ""}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[14px] text-[#666666]">
                  Het retouradres wordt geladen.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#111111]">
                Retourkosten
              </h2>

              <p className="mt-3 text-[14px] leading-6 text-[#666666]">
                De kosten voor het terugsturen van een product zijn voor
                rekening van de klant, tenzij anders met Refixion is
                afgesproken.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#111111]">
                Staat van het toestel
              </h2>

              <p className="mt-3 text-[14px] leading-6 text-[#666666]">
                Je mag het toestel beoordelen en gebruiken voor zover dat
                nodig is om de aard, kenmerken en werking ervan vast te
                stellen. Als het toestel verder is gebruikt dan daarvoor
                noodzakelijk en daardoor waardevermindering heeft opgelopen,
                kan Refixion deze waardevermindering in rekening brengen.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#111111]">
                Terugbetaling
              </h2>

              <p className="mt-3 text-[14px] leading-6 text-[#666666]">
                Na een geldige herroeping betalen we het aankoopbedrag terug
                volgens de wettelijke regels. De terugbetaling vindt plaats
                via dezelfde betaalmethode als waarmee de oorspronkelijke
                bestelling is betaald, tenzij anders overeengekomen.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-semibold text-[#111111]">
                Retour is geen garantie
              </h2>

              <p className="mt-3 text-[14px] leading-6 text-[#666666]">
                Het herroepingsrecht staat los van je wettelijke rechten bij
                een defect of een product dat niet aan de overeenkomst
                voldoet. Heb je een probleem met je toestel? Neem dan eerst
                contact met ons op via info@refixion.nl.
              </p>
            </section>
          </div>

          <div>
            <div className="sticky top-24 rounded-2xl border border-[#EAEAEA] p-6 md:p-7">
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-[#111111] flex items-center justify-center mx-auto">
                    <CheckCircle2
                      className="h-6 w-6 text-white"
                      strokeWidth={1.8}
                    />
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-[#111111]">
                    Herroeping ontvangen
                  </h2>

                  <p className="mt-3 text-[14px] leading-6 text-[#666666]">
                    We hebben je aanvraag ontvangen. We nemen indien nodig
                    contact met je op over de retourzending.
                  </p>

                  <Link
                    to="/shop"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333333]"
                  >
                    Terug naar de shop
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-[18px] font-semibold text-[#111111]">
                    Aankoop herroepen
                  </h2>

                  <p className="mt-2 text-[13px] leading-5 text-[#666666]">
                    Je kunt je herroeping ook per e-mail melden via{" "}
                    <a
                      href="mailto:info@refixion.nl"
                      className="text-[#111111] underline underline-offset-2"
                    >
                      info@refixion.nl
                    </a>
                    .
                  </p>

                  <form onSubmit={submitReturn} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-1">
                        Ordernummer *
                      </label>

                      <input
                        value={form.order_number}
                        onChange={(e) =>
                          set({ order_number: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2.5 text-[14px] outline-none focus:border-[#111111]"
                        placeholder="Bijv. RF-2026-0001"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-1">
                          Voornaam *
                        </label>

                        <input
                          value={form.first_name}
                          onChange={(e) =>
                            set({ first_name: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2.5 text-[14px] outline-none focus:border-[#111111]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-1">
                          Achternaam *
                        </label>

                        <input
                          value={form.last_name}
                          onChange={(e) =>
                            set({ last_name: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2.5 text-[14px] outline-none focus:border-[#111111]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-1">
                        E-mailadres *
                      </label>

                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set({ email: e.target.value })}
                        className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2.5 text-[14px] outline-none focus:border-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-1">
                        Product *
                      </label>

                      <input
                        value={form.product}
                        onChange={(e) => set({ product: e.target.value })}
                        className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2.5 text-[14px] outline-none focus:border-[#111111]"
                        placeholder="Bijv. iPhone 13 128GB"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#666666] mb-1">
                        Besteldatum
                      </label>

                      <input
                        type="date"
                        value={form.order_date}
                        onChange={(e) => set({ order_date: e.target.value })}
                        className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2.5 text-[14px] outline-none focus:border-[#111111]"
                      />
                    </div>

                    <label className="flex items-start gap-3 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.declaration}
                        onChange={(e) =>
                          set({ declaration: e.target.checked })
                        }
                        className="mt-0.5 h-4 w-4 accent-black"
                      />

                      <span className="text-[13px] leading-5 text-[#666666]">
                        Ik wil mijn online aankoop herroepen en het product
                        retourneren.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333333] disabled:opacity-50"
                    >
                      {submitting
                        ? "Verzenden..."
                        : "Herroeping versturen"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#EAEAEA]">
          <div className="flex items-center gap-2 text-[13px] text-[#666666]">
            <Mail className="h-4 w-4" strokeWidth={1.5} />
            Vragen over retourneren?{" "}
            <a
              href="mailto:info@refixion.nl"
              className="text-[#111111] underline underline-offset-2"
            >
              info@refixion.nl
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
