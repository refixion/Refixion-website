import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../../lib/api";
import { toast } from "sonner";

export default function AdminEmailSettingsPage() {
  const [s, setS] = useState({ smtp_host: "", smtp_port: 587, smtp_username: "", smtp_password: "", sender_name: "Refixion", sender_email: "", reply_to: "", use_tls: true });
  useEffect(() => {
    api.get("/admin/email-settings").then((r) => { if (r.data && r.data.smtp_host) setS((prev) => ({ ...prev, ...r.data, smtp_password: "" })); });
  }, []);
  const save = async () => {
    try {
      await api.put("/admin/email-settings", { ...s, smtp_port: Number(s.smtp_port), reply_to: s.reply_to || null });
      toast.success("Opgeslagen");
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const test = async () => {
    try {
      const r = await api.post("/admin/email-settings/test");
      if (r.data.ok) toast.success("Testmail verstuurd"); else toast.error("Verzenden mislukt");
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  return (
    <div>
      <h1 className="text-3xl tracking-tight font-semibold">E-mailinstellingen.</h1>
      <p className="mt-2 text-[14px] text-[#666666]">Configureer SMTP zonder de code aan te passen.</p>
      <div className="mt-8 rounded-2xl bg-white border border-[#EAEAEA] p-6 max-w-xl space-y-4">
        {[
          ["smtp_host","SMTP host","smtp.gmail.com"],["smtp_port","Port",""],["smtp_username","Gebruikersnaam",""],["smtp_password","Wachtwoord (laat leeg om te behouden)",""],["sender_name","Afzender naam",""],["sender_email","Afzender e-mail",""],["reply_to","Reply-to (optioneel)",""],
        ].map(([k, l, ph]) => (
          <div key={k}>
            <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">{l}</label>
            <input data-testid={`email-${k}`} type={k === "smtp_password" ? "password" : "text"} placeholder={ph} value={s[k] || ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} className="w-full rounded-xl border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
          </div>
        ))}
        <label className="inline-flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={!!s.use_tls} onChange={(e) => setS({ ...s, use_tls: e.target.checked })} className="accent-[#111111] h-4 w-4" /> STARTTLS gebruiken
        </label>
        <div className="flex gap-3 pt-2">
          <button data-testid="email-save" onClick={save} className="rounded-full bg-[#111111] text-white px-6 py-2.5 text-[13px] font-medium">Opslaan</button>
          <button data-testid="email-test" onClick={test} className="rounded-full border border-[#EAEAEA] px-6 py-2.5 text-[13px]">Test e-mail</button>
        </div>
      </div>
    </div>
  );
}
