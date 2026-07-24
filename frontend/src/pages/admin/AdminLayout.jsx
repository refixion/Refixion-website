import React from "react";
import { Link, NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { LayoutDashboard, Calendar, Wrench, Settings, Mail, Store, LogOut, Smartphone, LayoutTemplate, Search, ShieldCheck, ShoppingBag } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Toaster } from "sonner";
import { LogoFull } from "../../components/site/Logo";

const LINKS = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/bookings", label: "Boekingen", Icon: Calendar },
  { to: "/admin/devices", label: "Toestellen & prijzen", Icon: Smartphone },
  { to: "/admin/shop", label: "Shop", Icon: ShoppingBag },
  { to: "/admin/repair-methods", label: "Reparatiemethoden", Icon: Wrench },
  { to: "/admin/warranties", label: "Garanties", Icon: ShieldCheck },
  { to: "/admin/content", label: "Website inhoud", Icon: LayoutTemplate },
  { to: "/admin/seo", label: "SEO", Icon: Search },
  { to: "/admin/workshop", label: "Werkplaats", Icon: Store },
  { to: "/admin/email", label: "E-mailinstellingen", Icon: Mail },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (user === null) return <div className="min-h-screen flex items-center justify-center text-[#666666]">Laden...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Toaster position="top-center" richColors />
      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-[#EAEAEA] bg-white lg:min-h-screen">
          <div className="p-6 flex items-center gap-2">
            <LogoFull height={24} />
            <span className="text-[12px] uppercase tracking-wider text-[#666666]">Admin</span>
          </div>
          <nav className="px-3 py-2 space-y-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                data-testid={`admin-nav-${l.to.split("/").pop() || "dashboard"}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-colors ${isActive ? "bg-[#111111] text-white" : "text-[#666666] hover:bg-[#FAFAFA] hover:text-[#111111]"}`
                }
              >
                <l.Icon className="h-4 w-4" strokeWidth={1.5} /> {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 mt-6 border-t border-[#EAEAEA]">
            <button data-testid="admin-logout" onClick={async () => { await logout(); nav("/admin/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-[#666666] hover:bg-[#FAFAFA] hover:text-[#111111]">
              <LogOut className="h-4 w-4" strokeWidth={1.5} /> Uitloggen
            </button>
            <Link to="/" className="mt-2 block px-3 py-2.5 text-[13px] text-[#666666] hover:text-[#111111]">← Terug naar website</Link>
          </div>
        </aside>
        <main className="p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
