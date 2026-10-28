import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../../lib/api";
import { toast } from "sonner";
import { Sparkles, Check, X, Search, ShieldCheck, RefreshCw } from "lucide-react";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Invoer formulier
  const [snapchatHandle, setSnapchatHandle] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  // Code Checker
  const [checkCode, setCheckCode] = useState("");
  const [checkedItem, setCheckedItem] = useState(null);
  const [checking, setChecking] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/campaigns");
      setCampaigns(res.data);
    } catch (e) {
      toast.error(formatApiErrorDetail?.(e.response?.data?.detail) || "Fout bij ophalen acties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!snapchatHandle.trim() || !email.trim()) {
      toast.error("Vul zowel de Snapchat-gebruikersnaam als het e-mailadres in.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/campaigns", {
        snapchat_handle: snapchatHandle.trim(),
        email: email.trim(),
        marketing_consent: marketingConsent,
        discount_eur: 10.0,
      });
      toast.success("Actie geregistreerd! 6-uur verificatietimer loopt.");
      setSnapchatHandle("");
      setEmail("");
      setMarketingConsent(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(formatApiErrorDetail?.(err.response?.data?.detail) || "Kon actie niet aanmaken");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, action) => {
    try {
      await api.patch(`/admin/campaigns/${id}/status?action=${action}`);
      toast.success(action === "approve" ? "Goedgekeurd & QR-code mail verzonden!" : "Deelname afgewezen.");
      fetchCampaigns();
    } catch (err) {
      toast.error(formatApiErrorDetail?.(err.response?.data?.detail) || "Kon status niet bijwerken");
    }
  };

  const handleCheckCode = async (e) => {
    e.preventDefault();
    if (!checkCode.trim()) return;
    setChecking(true);
    setCheckedItem(null);
    try {
      const res = await api.get(`/admin/campaigns/check/${checkCode.trim()}`);
      setCheckedItem(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ongeldige of verlopen kortingscode.");
    } finally {
      setChecking(false);
    }
  };

  const handleRedeem = async (codeToRedeem) => {
    try {
      const res = await api.post(`/admin/campaigns/redeem/${codeToRedeem}`);
      toast.success(res.data.message || "Code succesvol verzilverd!");
      setCheckedItem(null);
      setCheckCode("");
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Fout bij verzilveren van korting.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl tracking-tight font-semibold">Snapchat Acties & Kortingscodes</h1>
        <button
          onClick={fetchCampaigns}
          disabled={loading}
          className="rounded-full border border-[#EAEAEA] bg-white px-4 py-2 text-[13px] font-medium text-[#111111] hover:bg-[#FAFAFA] inline-flex items-center gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
          Vernieuwen
        </button>
      </div>
      <p className="text-[14px] text-[#666666]">
        Registreer Snapchat verhalen, verifieer claims met override en verzilver kortingscodes bij reparatie.
      </p>

      {/* Grid: Nieuwe Deelname & Code Verifiëren */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {/* Kaart 1: Registreren */}
        <div className="rounded-2xl bg-white border border-[#EAEAEA] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
            <h2 className="text-[16px] font-semibold text-[#111111]">Nieuwe Snapchat Deelname</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">
                Snapchat Gebruikersnaam
              </label>
              <input
                type="text"
                placeholder="@gebruikersnaam"
                value={snapchatHandle}
                onChange={(e) => setSnapchatHandle(e.target.value)}
                className="w-full rounded-xl border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#666666] block mb-1">
                E-mailadres Klant
              </label>
              <input
                type="email"
                placeholder="klant@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-[#111111]"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-[13px] text-[#444444] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="accent-[#111111] h-4 w-4 rounded"
              />
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#10B981]" strokeWidth={1.5} />
                Toestemming voor marketingmails (AVG)
              </span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-[#111111] text-white py-2.5 text-[13px] font-medium hover:bg-[#333333] transition disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Deelname starten (6-uur timer)"}
            </button>
          </form>
        </div>

        {/* Kaart 2: Code Checker & Verzilveren */}
        <div className="rounded-2xl bg-white border border-[#EAEAEA] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-[#111111]" strokeWidth={1.5} />
            <h2 className="text-[16px] font-semibold text-[#111111]">Kortingscode Verifiëren</h2>
          </div>
          <form onSubmit={handleCheckCode} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="RFX-XXXX"
              value={checkCode}
              onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
              className="flex-1 uppercase font-mono tracking-wider rounded-xl border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-[#111111]"
            />
            <button
              type="submit"
              disabled={checking}
              className="rounded-full bg-[#111111] text-white px-5 py-2.5 text-[13px] font-medium hover:bg-[#333333] transition disabled:opacity-50"
            >
              Checken
            </button>
          </form>

          {checkedItem && (
            <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#065F46]">Geldige kortingscode</span>
                <span className="font-mono text-[14px] font-bold text-[#065F46]">{checkedItem.code}</span>
              </div>
              <p className="text-[13px] text-[#047857] mt-1 mb-3">
                Korting: <b>€{checkedItem.discount_eur?.toFixed(2)}</b> voor <b>@{checkedItem.snapchat_handle}</b>
              </p>
              <button
                type="button"
                onClick={() => handleRedeem(checkedItem.code)}
                className="w-full rounded-full bg-[#10B981] text-white py-2 text-[13px] font-medium hover:bg-[#059669] transition"
              >
                Verzilver €{checkedItem.discount_eur?.toFixed(2)} Korting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabel met overzicht van acties */}
      <div className="mt-8 rounded-2xl bg-white border border-[#EAEAEA] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAEAEA]">
          <h3 className="text-[15px] font-medium text-[#111111]">Overzicht Deelnames</h3>
        </div>
        <div className="divide-y divide-[#EAEAEA]">
          {campaigns.length === 0 && (
            <div className="p-8 text-center text-[13px] text-[#666666]">Nog geen acties aangemaakt.</div>
          )}
          {campaigns.map((c) => (
            <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[14px] text-[#111111]">@{c.snapchat_handle}</span>
                  <span className="font-mono text-[12px] px-2 py-0.5 rounded bg-[#F5F5F5] text-[#555555]">
                    {c.code}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      c.status === "active"
                        ? "bg-[#D1FAE5] text-[#065F46]"
                        : c.status === "pending"
                        ? "bg-[#FEF3C7] text-[#92400E]"
                        : c.status === "used"
                        ? "bg-[#F3F4F6] text-[#6B7280] line-through"
                        : "bg-[#FEE2E2] text-[#991B1B]"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-[12px] text-[#666666] mt-1">{c.email}</div>
              </div>

              {/* Actieknoppen */}
              <div className="flex items-center gap-2">
                {c.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(c.id, "approve")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981] text-white px-3.5 py-1.5 text-[12px] font-medium hover:bg-[#059669] transition"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2} /> Goedkeuren (Override)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(c.id, "reject")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-white text-[#666666] px-3.5 py-1.5 text-[12px] font-medium hover:bg-[#FAFAFA] hover:text-[#DC2626] transition"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} /> Afkeuren
                    </button>
                  </>
                )}
                {c.status === "active" && (
                  <button
                    type="button"
                    onClick={() => handleRedeem(c.code)}
                    className="rounded-full bg-[#111111] text-white px-4 py-1.5 text-[12px] font-medium hover:bg-[#333333] transition"
                  >
                    Direct verzilveren
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}