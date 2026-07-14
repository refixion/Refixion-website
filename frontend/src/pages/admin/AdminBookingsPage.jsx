import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Search, Trash2 } from "lucide-react";

const STATUSES = ["pending", "confirmed", "in_progress", "ready", "completed", "cancelled"];
const STATUS_LABEL = { pending: "In afwachting", confirmed: "Bevestigd", in_progress: "Bezig", ready: "Klaar voor afhalen", completed: "Afgerond", cancelled: "Geannuleerd" };

export default function AdminBookingsPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const load = () => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    api.get(`/admin/bookings?${p.toString()}`).then((r) => setRows(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, q]);

  const changeStatus = async (id, s) => {
    await api.patch(`/admin/bookings/${id}`, { status: s });
    toast.success("Status bijgewerkt");
    load();
  };
  const del = async (id) => {
    if (!window.confirm("Boeking verwijderen?")) return;
    await api.delete(`/admin/bookings/${id}`);
    toast.success("Verwijderd");
    load();
  };
  const exportCsv = () => {
    const header = ["reference","first_name","last_name","email","phone","brand","device","repair","method","date","time","price","status"];
    const lines = rows.map(r => [r.reference,r.first_name,r.last_name,r.email,r.phone,r.brand_name,r.device_name,r.repair_name,r.method_title,r.appointment_date,r.appointment_time,r.total_price,r.status].map(v => `"${(v ?? "").toString().replace(/"/g,'""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "refixion-bookings.csv"; a.click();
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl tracking-tight font-semibold">Boekingen.</h1>
        <button data-testid="admin-export-csv" onClick={exportCsv} className="rounded-full border border-[#EAEAEA] px-4 py-2 text-[13px] hover:bg-white">Exporteer CSV</button>
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative">
          <Search className="h-4 w-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
          <input data-testid="admin-bookings-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoeken..." className="pl-10 pr-4 py-2.5 rounded-full border border-[#EAEAEA] text-[13px] w-64 bg-white outline-none focus:border-[#111111]" />
        </div>
        <select data-testid="admin-bookings-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-[#EAEAEA] px-4 py-2.5 text-[13px] bg-white">
          <option value="">Alle statussen</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>
      <div className="rounded-2xl bg-white border border-[#EAEAEA] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#FAFAFA] text-left text-[#666666]">
            <tr>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Klant</th>
              <th className="px-4 py-3 font-medium">Reparatie</th>
              <th className="px-4 py-3 font-medium">Datum/Tijd</th>
              <th className="px-4 py-3 font-medium">Prijs</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-[#EAEAEA]">
                <td className="px-4 py-3 font-medium text-[#111111]">{r.reference}</td>
                <td className="px-4 py-3">
                  <div className="text-[#111111]">{r.first_name} {r.last_name}</div>
                  <div className="text-[#666666] text-[12px]">{r.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[#111111]">{r.brand_name} {r.device_name}</div>
                  <div className="text-[#666666] text-[12px]">{r.repair_name}{r.part_quality_label ? ` · ${r.part_quality_label}` : ""} · {r.method_title}</div>
                  {r.warranty_label && <div className="text-[#666666] text-[11px] mt-0.5">Garantie: {r.warranty_label}</div>}
                </td>
                <td className="px-4 py-3 text-[#111111]">{r.appointment_date}<br /><span className="text-[#666666] text-[12px]">{r.appointment_time}</span></td>
                <td className="px-4 py-3 text-[#111111]">€{Number(r.total_price).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <select data-testid={`booking-status-${r.id}`} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} className="rounded-full border border-[#EAEAEA] px-3 py-1.5 text-[12px] bg-white">
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(r.id)} className="text-[#666666] hover:text-[#DC2626] p-2" aria-label="verwijderen"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-[#666666]">Geen boekingen gevonden.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
