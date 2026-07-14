import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { t } from "../../i18n";
import { useSiteContent } from "../../lib/useSiteContent";
import { api } from "../../lib/api";
import { LogoFull } from "./Logo";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS_NL = { monday: "Ma", tuesday: "Di", wednesday: "Wo", thursday: "Do", friday: "Vr", saturday: "Za", sunday: "Zo" };

export default function Footer() {
  const content = useSiteContent();
  const [ws, setWs] = useState(null);
  useEffect(() => { api.get("/workshop").then((r) => setWs(r.data)).catch(() => {}); }, []);

  const footer = content?.footer || {};

  return (
    <footer data-testid="site-footer" className="border-t border-[#EAEAEA] bg-[#FAFAFA] mt-24">
      <div className="container-page py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <LogoFull height={32} />
          <p className="mt-4 text-[14px] text-[#666666] leading-relaxed max-w-sm">
            {footer.tagline || "Premium smartphone reparaties met volledige transparantie, moderne technologie en uitzonderlijke service."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {footer.instagram_url && (
              <a href={footer.instagram_url} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-[#EAEAEA] hover:bg-white transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
              </a>
            )}
            {footer.facebook_url && (
              <a href={footer.facebook_url} target="_blank" rel="noreferrer" className="p-2 rounded-full border border-[#EAEAEA] hover:bg-white transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-4">{t("footer.repairs")}</div>
          <ul className="space-y-3 text-[14px]">
            <li><Link to="/repairs?brand=apple" className="text-[#111111] hover:text-[#666666]">Apple iPhone</Link></li>
            <li><Link to="/repairs?brand=samsung" className="text-[#111111] hover:text-[#666666]">Samsung Galaxy</Link></li>
            <li><Link to="/garantie" className="text-[#111111] hover:text-[#666666]">Garantie</Link></li>
            <li><Link to="/booking" className="text-[#111111] hover:text-[#666666]">{t("nav.book_repair")}</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-4">{t("footer.company")}</div>
          <ul className="space-y-3 text-[14px] text-[#111111]">
            {ws && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#666666]" strokeWidth={1.5} />{ws.address}, {ws.city}</li>}
            {ws?.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#666666]" strokeWidth={1.5} />{ws.email}</li>}
            {ws?.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#666666]" strokeWidth={1.5} />{ws.phone}</li>}
          </ul>
          <div className="mt-6 text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-3">{t("footer.opening_hours")}</div>
          <ul className="space-y-1 text-[13px] text-[#666666]">
            {ws && DAY_KEYS.map((d) => {
              const h = ws.opening_hours?.[d];
              if (!h) return null;
              return <li key={d}>{DAY_LABELS_NL[d]} · {h.closed ? t("common.closed") : `${h.open} – ${h.close}`}</li>;
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#EAEAEA]">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-[#666666]">
          <div>© {new Date().getFullYear()} {ws?.business_name || "Refixion"}. {t("footer.all_rights_reserved")}</div>
          <div className="flex items-center gap-6">
            <Link to="/legal/privacy" className="hover:text-[#111111]">{t("footer.privacy")}</Link>
            <Link to="/legal/cookies" className="hover:text-[#111111]">{t("footer.cookies")}</Link>
            <Link to="/legal/terms" className="hover:text-[#111111]">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
