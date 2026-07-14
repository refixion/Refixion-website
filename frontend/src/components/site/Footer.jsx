import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="border-t border-[#EAEAEA] bg-[#FAFAFA] mt-24">
      <div className="container-page py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#111111] flex items-center justify-center">
              <span className="text-white text-[14px] font-semibold">R</span>
            </div>
            <span className="text-[18px] font-semibold tracking-tight">Refixion</span>
          </div>
          <p className="mt-4 text-[14px] text-[#666666] leading-relaxed max-w-sm">
            Premium smartphone reparaties met volledige transparantie, moderne technologie en uitzonderlijke service.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-[#EAEAEA] hover:bg-white transition-colors" aria-label="Instagram">
              <Instagram className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-[#EAEAEA] hover:bg-white transition-colors" aria-label="Facebook">
              <Facebook className="h-4 w-4 text-[#111111]" strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-4">Reparaties</div>
          <ul className="space-y-3 text-[14px]">
            <li><Link to="/repairs?brand=apple" className="text-[#111111] hover:text-[#666666]">Apple iPhone</Link></li>
            <li><Link to="/repairs?brand=samsung" className="text-[#111111] hover:text-[#666666]">Samsung Galaxy</Link></li>
            <li><Link to="/repairs?brand=google" className="text-[#111111] hover:text-[#666666]">Google Pixel</Link></li>
            <li><Link to="/repairs?brand=oneplus" className="text-[#111111] hover:text-[#666666]">OnePlus</Link></li>
            <li><Link to="/booking" className="text-[#111111] hover:text-[#666666]">Reparatie boeken</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-4">Bedrijf</div>
          <ul className="space-y-3 text-[14px] text-[#111111]">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#666666]" strokeWidth={1.5} />Herengracht 182, Amsterdam</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#666666]" strokeWidth={1.5} />hello@refixion.nl</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#666666]" strokeWidth={1.5} />+31 20 123 4567</li>
          </ul>
          <div className="mt-6 text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-3">Openingstijden</div>
          <ul className="space-y-1 text-[13px] text-[#666666]">
            <li>Ma – Vr · 09:00 – 18:00</li>
            <li>Do · 09:00 – 20:00</li>
            <li>Za · 10:00 – 17:00</li>
            <li>Zo · Gesloten</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#EAEAEA]">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-[#666666]">
          <div>© {new Date().getFullYear()} Refixion. Alle rechten voorbehouden.</div>
          <div className="flex items-center gap-6">
            <Link to="/legal/privacy" className="hover:text-[#111111]">Privacybeleid</Link>
            <Link to="/legal/cookies" className="hover:text-[#111111]">Cookiebeleid</Link>
            <Link to="/legal/terms" className="hover:text-[#111111]">Algemene voorwaarden</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
