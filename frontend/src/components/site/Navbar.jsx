import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { t } from "../../i18n";

const NAV = [
  { to: "/", key: "nav.home" },
  { to: "/repairs", key: "nav.repairs" },
  { to: "/pricing", key: "nav.pricing" },
  { to: "/business", key: "nav.business" },
  { to: "/about", key: "nav.about" },
  { to: "/reviews", key: "nav.reviews" },
  { to: "/faq", key: "nav.faq" },
  { to: "/contact", key: "nav.contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-navbar"
      className={`sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-[#EAEAEA]/70 transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}
    >
      <div className="container-page flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#111111] flex items-center justify-center">
            <span className="text-white text-[13px] font-semibold tracking-tight">R</span>
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-[#111111]">Refixion</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              data-testid={`nav-link-${n.to.slice(1) || "home"}`}
              className={({ isActive }) =>
                `text-[14px] transition-colors ${isActive ? "text-[#111111] font-medium" : "text-[#666666] hover:text-[#111111]"}`
              }
            >
              {t(n.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <motion.button
            data-testid="nav-book-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/booking")}
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-5 py-2.5 text-[14px] font-medium hover:bg-[#333] transition-colors shadow-sm hover:shadow-md"
          >
            Reparatie boeken
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </motion.button>
          <button
            data-testid="nav-mobile-toggle"
            aria-label="menu"
            className="lg:hidden p-2 rounded-lg text-[#111111]"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#EAEAEA] bg-white">
          <div className="container-page py-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-3 text-[15px] ${isActive ? "text-[#111111] font-medium" : "text-[#666666]"}`
                }
                data-testid={`mobile-nav-${n.to.slice(1) || "home"}`}
              >
                {t(n.key)}
              </NavLink>
            ))}
            <button
              onClick={() => { setOpen(false); navigate("/booking"); }}
              className="mt-3 w-full rounded-full bg-[#111111] text-white py-3 text-[14px] font-medium"
              data-testid="mobile-book-btn"
            >
              Reparatie boeken
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
