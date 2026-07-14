import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Calendar, CheckCircle2, Clock, Package } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_LABEL = { pending: "In afwachting", confirmed: "Bevestigd", in_progress: "Bezig", ready: "Klaar voor afhalen", completed: "Afgerond", cancelled: "Geannuleerd" };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    api.get("/admin/bookings/stats").then((r) => setStats(r.data));
    api.get("/admin/bookings").then((r) => setRecent(r.data.slice(0, 6)));
  }, []);
  return (
    <div>
      <h1 className="text-3xl tracking-tight font-semibold text-[#111111]">Dashboard.</h1>
      <p className="mt-2 text-[14px] text-[#666666]">Een snel overzicht van je operatie.</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "total", label: "Totaal boekingen", value: stats?.total ?? "—", Icon: Package },
          { k: "today", label: "Vandaag", value: stats?.today ?? "—", Icon: Calendar },
          { k: "pending", label: "In afwachting", value: stats?.by_status?.pending ?? 0, Icon: Clock },
          { k: "completed", label: "Afgerond", value: stats?.by_status?.completed ?? 0, Icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.k} data-testid={`admin-stat-${s.k}`} className="rounded-2xl bg-white border border-[#EAEAEA] p-6">
            <div className="flex items-center justify-between">
              <span className="text-[12px] uppercase tracking-wider text-[#666666]">{s.label}</span>
              <s.Icon className="h-4 w-4 text-[#666666]" strokeWidth={1.5} />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-[#111111]">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-white border border-[#EAEAEA]">
        <div className="p-6 flex items-center justify-between border-b border-[#EAEAEA]">
          <div className="text-[16px] font-medium">Recente boekingen</div>
          <Link to="/admin/bookings" className="text-[13px] text-[#111111] hover:underline">Alle bekijken</Link>
        </div>
        <div className="divide-y divide-[#EAEAEA]">
          {recent.length === 0 && <div className="p-6 text-[14px] text-[#666666]">Nog geen boekingen.</div>}
          {recent.map((b) => (
            <div key={b.id} className="p-6 flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-medium text-[#111111]">{b.first_name} {b.last_name} · {b.reference}</div>
                <div className="text-[13px] text-[#666666]">{b.brand_name} {b.device_name} — {b.repair_name}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] text-[#111111]">{b.appointment_date} · {b.appointment_time}</div>
                <div className="text-[12px] text-[#666666]">{STATUS_LABEL[b.status] || b.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
