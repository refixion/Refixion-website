
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";
import { FaTiktok } from "react-icons/fa6";
import { t } from "../../i18n";
import { useSiteContent } from "../../lib/useSiteContent";
import { api } from "../../lib/api";
import { LogoFull } from "./Logo";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS_NL = {
  monday: "Ma",
  tuesday: "Di",
  wednesday: "Wo",
  thursday: "Do",
  friday: "Vr",
  saturday: "Za",
  sunday: "Zo",
};

export default function Footer() {
  const content = useSiteContent();
  const [ws, setWs] = useState(null);

  useEffect(() => {
    api.get("/workshop").then((r) => setWs(r.data)).catch(() => {});
  }, []);

  const footer = content?.footer || {};

  return (
    <footer className="border-t border-[#EAEAEA] bg-white">
      <div className="container-page py-12 grid md:grid-cols-3 gap-10">

        {/* Refixion */}
        <div>
          <LogoFull />

          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[#666666]">
            {footer.tagline ||
              "Premium smartphone reparaties met volledige transparantie, moderne technologie en uitzonderlijke service."}
          </p>

          <div className="mt-5 flex items-center gap-3">
            {footer.instagram_url && (
              <a
                href={footer.instagram_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="text-[#666666] hover:text-[#111111]"
              >
                <Instagram className="h-5 w-5" strokeWidth={1.5} />
              </a>
            )}

            {footer.tiktok_url && (
              <a
                href={footer.tiktok_url}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="text-[#666666] hover:text-[#111111]"
              >
                <FaTiktok className="h-5 w-5" />
              </a>
            )}

            {footer.facebook_url && (
              <a
                href={footer.facebook_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="text-[#666666] hover:text-[#111111]"
              >
                Facebook
              </a>
            )}
          </div>
        </div>

        {/* Reparaties */}
        <div>
          <div className="text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-4">
            {t("footer.repairs")}
          </div>

          <ul className="space-y-3 text-[14px]">
            <li>
              <Link
                to="/repairs?brand=apple"
                className="text-[#111111] hover:text-[#666666]"
              >
                Apple iPhone
              </Link>
            </li>

            <li>
              <Link
                to="/repairs?brand=samsung"
                className="text-[#111111] hover:text-[#666666]"
              >
                Samsung Galaxy
              </Link>
            </li>

            <li>
              <Link
                to="/garantie"
                className="text-[#111111] hover:text-[#666666]"
              >
                Garantie
              </Link>
            </li>

            <li>
              <Link
                to="/booking"
                className="text-[#111111] hover:text-[#666666]"
              >
                {t("nav.book_repair")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Bedrijf */}
        <div>
          <div className="text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-4">
            {t("footer.company")}
          </div>

          <ul className="space-y-3 text-[14px] text-[#111111]">
            {ws && (
              <li className="flex items-start gap-2">
                <MapPin
                  className="h-4 w-4 mt-0.5 shrink-0 text-[#666666]"
                  strokeWidth={1.5}
                />
                <span>
                  {ws.address}, {ws.city}
                </span>
              </li>
            )}

            {ws?.email && (
              <li className="flex items-center gap-2">
                <Mail
                  className="h-4 w-4 shrink-0 text-[#666666]"
                  strokeWidth={1.5}
                />
                <a
                  href={`mailto:${ws.email}`}
                  className="hover:text-[#666666]"
                >
                  {ws.email}
                </a>
              </li>
            )}

            {ws?.phone && (
              <li className="flex items-center gap-2">
                <Phone
                  className="h-4 w-4 shrink-0 text-[#666666]"
                  strokeWidth={1.5}
                />
                <a
                  href={`tel:${ws.phone}`}
                  className="hover:text-[#666666]"
                >
                  {ws.phone}
                </a>
              </li>
            )}

            {/* Juridische bedrijfsgegevens */}
            <li className="pt-2 text-[13px] text-[#666666]">
              KVK: 42131896
              BTW-ID: NL005520371B37
            </li>
          </ul>

          <div className="mt-6 text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-3">
            {t("footer.opening_hours")}
          </div>

          <ul className="space-y-1 text-[13px] text-[#666666]">
            {ws &&
              DAY_KEYS.map((d) => {
                const h = ws.opening_hours?.[d];

                if (!h) return null;

                return (
                  <li key={d}>
                    {DAY_LABELS_NL[d]} ·{" "}
                    {h.closed ? t("common.closed") : `${h.open} – ${h.close}`}
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-[#EAEAEA]">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-[#666666]">
          <div>
            © {new Date().getFullYear()}{" "}
            {ws?.business_name || "Refixion"}.{" "}
            {t("footer.all_rights_reserved")}
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/legal/privacy"
              className="hover:text-[#111111]"
            >
              {t("footer.privacy")}
            </Link>

            <Link
              to="/legal/cookies"
              className="hover:text-[#111111]"
            >
              {t("footer.cookies")}
            </Link>

            <Link
              to="/legal/terms"
              className="hover:text-[#111111]"
            >
              {t("footer.terms")}
            </Link>
            <Link
              to="/retourneren"
              className="hover:text-[#111111]"
            >
              Retourneren & herroepen
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
