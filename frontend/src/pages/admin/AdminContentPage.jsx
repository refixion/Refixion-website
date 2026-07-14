import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../../lib/api";
import { toast } from "sonner";
import { invalidateSiteContent } from "../../lib/useSiteContent";
import { Trash2, Plus, ChevronDown } from "lucide-react";

/**
 * AdminContentPage — every homepage section editable.
 * The form is section-based (accordion) to keep the very long form manageable.
 */
export default function AdminContentPage() {
  const [content, setContent] = useState(null);
  const [open, setOpen] = useState("hero");

  useEffect(() => { api.get("/site-content").then((r) => setContent(r.data)); }, []);

  if (!content) return <div className="text-[#666666]">Laden...</div>;

  const upd = (section, patch) => setContent({ ...content, [section]: { ...content[section], ...patch } });

  const save = async () => {
    try {
      await api.put("/admin/site-content", {
        hero: content.hero, trust: content.trust, how_it_works: content.how_it_works,
        brands_section: content.brands_section, why: content.why, reviews_section: content.reviews_section,
        faq_section: content.faq_section, cta: content.cta, footer: content.footer,
      });
      invalidateSiteContent();
      toast.success("Website inhoud opgeslagen");
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl tracking-tight font-semibold">Website inhoud.</h1>
        <button data-testid="content-save-all" onClick={save} className="rounded-full bg-[#111111] text-white px-6 py-2.5 text-[13px] font-medium hover:bg-[#333]">Alles opslaan</button>
      </div>
      <p className="text-[14px] text-[#666666]">Bewerk elke sectie van de homepage en footer.</p>

      <div className="mt-8 space-y-3">
        <Section id="hero" label="Hero" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Badge tekst" value={content.hero.badge_text} onChange={(v) => upd("hero", { badge_text: v })} testId="hero-badge_text" />
            <BoolField label="Badge zichtbaar" value={content.hero.badge_enabled} onChange={(v) => upd("hero", { badge_enabled: v })} />
            <Field label="Headline regel 1" value={content.hero.headline_line1} onChange={(v) => upd("hero", { headline_line1: v })} testId="hero-headline_line1" full />
            <Field label="Headline regel 2 (grijs)" value={content.hero.headline_line2} onChange={(v) => upd("hero", { headline_line2: v })} full />
            <Field label="Subtitel" value={content.hero.subtitle} onChange={(v) => upd("hero", { subtitle: v })} textarea full />
            <Field label="Primaire knop label" value={content.hero.primary_button_label} onChange={(v) => upd("hero", { primary_button_label: v })} />
            <Field label="Primaire knop link" value={content.hero.primary_button_link} onChange={(v) => upd("hero", { primary_button_link: v })} />
            <Field label="Secundaire knop label" value={content.hero.secondary_button_label} onChange={(v) => upd("hero", { secondary_button_label: v })} />
            <Field label="Secundaire knop link" value={content.hero.secondary_button_link} onChange={(v) => upd("hero", { secondary_button_link: v })} />
            <Field label="Hero afbeelding URL" value={content.hero.hero_image_url} onChange={(v) => upd("hero", { hero_image_url: v })} full />
            {content.hero.hero_image_url && (
              <div className="md:col-span-2"><img src={content.hero.hero_image_url} alt="preview" className="rounded-2xl border border-[#EAEAEA] w-full max-w-sm aspect-[4/5] object-cover" /></div>
            )}
          </Grid>
          <SubHeading>Zwevende kaarten</SubHeading>
          <ListEditor
            items={content.hero.floating_cards}
            onChange={(items) => upd("hero", { floating_cards: items })}
            fields={[{ k: "icon", l: "Icon (shield-check, zap, sparkles)" }, { k: "text", l: "Tekst" }]}
            addLabel="Kaart toevoegen"
            newItem={() => ({ icon: "sparkles", text: "" })}
          />
        </Section>

        <Section id="trust" label="Vertrouwen (Trust)" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Eyebrow" value={content.trust.eyebrow} onChange={(v) => upd("trust", { eyebrow: v })} />
            <Field label="Heading" value={content.trust.heading} onChange={(v) => upd("trust", { heading: v })} full />
          </Grid>
          <SubHeading>Statistiek-kaarten</SubHeading>
          <ListEditor
            items={content.trust.cards}
            onChange={(items) => upd("trust", { cards: items })}
            fields={[
              { k: "label", l: "Label" },
              { k: "value_type", l: "Type (number / text / reviews_avg)" },
              { k: "value", l: "Waarde" },
              { k: "suffix", l: "Suffix" },
            ]}
            addLabel="Kaart toevoegen"
            newItem={() => ({ label: "", value_type: "text", value: "", suffix: "" })}
          />
        </Section>

        <Section id="how_it_works" label="Hoe het werkt" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Eyebrow" value={content.how_it_works.eyebrow} onChange={(v) => upd("how_it_works", { eyebrow: v })} />
            <Field label="Heading" value={content.how_it_works.heading} onChange={(v) => upd("how_it_works", { heading: v })} full />
          </Grid>
          <SubHeading>Stappen</SubHeading>
          <ListEditor
            items={content.how_it_works.steps}
            onChange={(items) => upd("how_it_works", { steps: items })}
            fields={[{ k: "title", l: "Titel" }, { k: "description", l: "Beschrijving" }]}
            addLabel="Stap toevoegen"
            newItem={() => ({ title: "", description: "" })}
          />
        </Section>

        <Section id="brands_section" label="Ondersteunde merken (kop)" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Eyebrow" value={content.brands_section.eyebrow} onChange={(v) => upd("brands_section", { eyebrow: v })} />
            <Field label="Heading" value={content.brands_section.heading} onChange={(v) => upd("brands_section", { heading: v })} full />
          </Grid>
          <p className="text-[12px] text-[#666666] mt-3">Merken zelf worden beheerd via het Reparaties-menu.</p>
        </Section>

        <Section id="why" label="Waarom Refixion" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Eyebrow" value={content.why.eyebrow} onChange={(v) => upd("why", { eyebrow: v })} />
            <Field label="Heading" value={content.why.heading} onChange={(v) => upd("why", { heading: v })} full />
          </Grid>
          <SubHeading>Items</SubHeading>
          <ListEditor
            items={content.why.items}
            onChange={(items) => upd("why", { items })}
            fields={[
              { k: "icon", l: "Icon (sparkles, wrench, shield-check, package, clock, cpu)" },
              { k: "title", l: "Titel" },
              { k: "description", l: "Beschrijving" },
            ]}
            addLabel="Item toevoegen"
            newItem={() => ({ icon: "sparkles", title: "", description: "" })}
          />
        </Section>

        <Section id="reviews_section" label="Reviews (kop)" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Eyebrow" value={content.reviews_section.eyebrow} onChange={(v) => upd("reviews_section", { eyebrow: v })} />
            <Field label="Heading template (gebruik {avg})" value={content.reviews_section.heading_template} onChange={(v) => upd("reviews_section", { heading_template: v })} full />
            <Field label="Link label" value={content.reviews_section.link_label} onChange={(v) => upd("reviews_section", { link_label: v })} />
          </Grid>
        </Section>

        <Section id="faq_section" label="FAQ (kop)" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Eyebrow" value={content.faq_section.eyebrow} onChange={(v) => upd("faq_section", { eyebrow: v })} />
            <Field label="Heading" value={content.faq_section.heading} onChange={(v) => upd("faq_section", { heading: v })} full />
            <Field label="Link label" value={content.faq_section.link_label} onChange={(v) => upd("faq_section", { link_label: v })} />
          </Grid>
        </Section>

        <Section id="cta" label="Final CTA" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Heading" value={content.cta.heading} onChange={(v) => upd("cta", { heading: v })} full />
            <Field label="Subtitel" value={content.cta.subtitle} onChange={(v) => upd("cta", { subtitle: v })} full />
            <Field label="Knop label" value={content.cta.button_label} onChange={(v) => upd("cta", { button_label: v })} />
            <Field label="Knop link" value={content.cta.button_link} onChange={(v) => upd("cta", { button_link: v })} />
          </Grid>
        </Section>

        <Section id="footer" label="Footer" open={open} setOpen={setOpen}>
          <Grid>
            <Field label="Tagline" value={content.footer.tagline} onChange={(v) => upd("footer", { tagline: v })} textarea full />
            <Field label="Instagram URL" value={content.footer.instagram_url} onChange={(v) => upd("footer", { instagram_url: v })} />
            <Field label="Facebook URL" value={content.footer.facebook_url} onChange={(v) => upd("footer", { facebook_url: v })} />
          </Grid>
        </Section>
      </div>

      <div className="mt-8 sticky bottom-4 flex justify-end">
        <button onClick={save} className="rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium shadow-lg">Alles opslaan</button>
      </div>
    </div>
  );
}

function Section({ id, label, open, setOpen, children }) {
  const isOpen = open === id;
  return (
    <div data-testid={`content-section-${id}`} className="rounded-2xl bg-white border border-[#EAEAEA] overflow-hidden">
      <button onClick={() => setOpen(isOpen ? null : id)} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="text-[15px] font-medium text-[#111111]">{label}</div>
        <ChevronDown className={`h-4 w-4 text-[#666666] transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-[#EAEAEA] pt-4">{children}</div>}
    </div>
  );
}
function Grid({ children }) { return <div className="grid md:grid-cols-2 gap-3">{children}</div>; }
function SubHeading({ children }) { return <div className="text-[12px] uppercase tracking-wider text-[#666666] mt-6 mb-3">{children}</div>; }
function Field({ label, value, onChange, textarea, full, testId }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">{label}</label>
      {textarea
        ? <textarea data-testid={testId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
        : <input data-testid={testId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />}
    </div>
  );
}
function BoolField({ label, value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-[13px] self-end pb-2">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-[#111111] h-4 w-4" /> {label}
    </label>
  );
}
function ListEditor({ items = [], onChange, fields, addLabel, newItem }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-[#EAEAEA] p-4">
          <div className="grid md:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.k} className={f.full ? "md:col-span-2" : ""}>
                <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">{f.l}</label>
                <input
                  value={item[f.k] ?? ""}
                  onChange={(e) => { const copy = [...items]; copy[i] = { ...copy[i], [f.k]: e.target.value }; onChange(copy); }}
                  className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={() => onChange(items.filter((_, k) => k !== i))} className="text-[#666666] hover:text-[#DC2626] p-2" aria-label="verwijderen"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...items, newItem()])} className="rounded-full border border-[#EAEAEA] px-4 py-2 text-[13px] inline-flex items-center gap-2 hover:bg-[#FAFAFA]">
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> {addLabel}
      </button>
    </div>
  );
}
