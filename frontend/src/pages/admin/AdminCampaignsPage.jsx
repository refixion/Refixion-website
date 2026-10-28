import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Gift, CheckCircle, XCircle, Clock, Zap, Search, ShieldCheck } from "lucide-react";

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
    try {
      const res = await api.get("/admin/campaigns");
      setCampaigns(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!snapchatHandle || !email) {
      toast.error("Vul zowel de Snapchat naam als e-mail in.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/campaigns", {
        snapchat_handle: snapchatHandle,
        email: email,
        marketing_consent: marketingConsent,
        discount_eur: 10.0,
      });
      toast.success("Actie gestart! Timer van 6 uur loopt.");
      setSnapchatHandle("");
      setEmail("");
      setMarketingConsent(false);
      fetchCampaigns();
    } catch (err) {
      toast.error("Fout bij aanmaken van actie.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, action) => {
    try {
      await api.patch(`/admin/campaigns/${id}/status?action=${action}`);
      toast.success(action === "approve" ? "Goedgekeurd & mail met code verzonden!" : "Deelname afgekeurd.");
      fetchCampaigns();
    } catch (err) {
      toast.error("Kon status niet bijwerken.");
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
      toast.error(err.response?.data?.detail || "Ongeldige of niet-gevonden code.");
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
      toast.error(err.response?.data?.detail || "Fout bij verzilveren.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-1 sm:px-0 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">Acties & Kortingscodes</h1>
        <p className="mt-1 text-sm text-neutral-500">Beheer Snapchat acties, verifieer posts en verzilver codes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Kaart 1: Nieuwe Deelnemer */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-neutral-800" />
            <h2 className="text-base font-semibold text-neutral-900">Nieuwe Snapchat Deelname</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Snapchat Gebruikersnaam</label>
              <input
                type="text"
                placeholder="@gebruikersnaam"
                value={snapchatHandle}
                onChange={(e) => setSnapchatHandle(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">E-mailadres van klant</label>
              <input
                type="email"
                placeholder="klant@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="consent"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <label htmlFor="consent" className="text-xs text-neutral-600 flex items-center gap-1 cursor-pointer">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Toestemming voor promotionele e-mails (AVG)
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 py-2.5 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition active:scale-95"
            >
              {saving ? "Opslaan..." : "Actie registreren & timer starten"}
            </button>
          </form>
        </div>

        {/* Kaart 2: Code Checker / Verzilveren */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-neutral-800" />
            <h2 className="text-base font-semibold text-neutral-900">Kortingscode Verifiëren</h2>
          </div>
          <form onSubmit={handleCheckCode} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="RFX-XXXX"
              value={checkCode}
              onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
              className="flex-1 uppercase font-mono tracking-wider text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <button
              type="submit"
              disabled={checking}
              className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-sm transition"
            >
              Checken
            </button>
          </form>

          {checkedItem && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-800">Geldige kortingscode!</span>
                <span className="font-mono text-sm font-bold text-emerald-900">{checkedItem.code}</span>
              </div>
              <div className="text-xs text-emerald-700 mb-3">
                Korting: <b>€{checkedItem.discount_eur.toFixed(2)}</b> voor <b>@{checkedItem.snapchat_handle}</b>
              </div>
              <button
                type="button"
                onClick={() => handleRedeem(checkedItem.code)}
                className="w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
              >
                Verzilver €{checkedItem.discount_eur.toFixed(2)} Korting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabel met overzicht */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 text-sm">Lopende en recente acties</h3>
          <button onClick={fetchCampaigns} className="text-xs text-neutral-500 hover:text-neutral-900">
            Vernieuwen
          </button>
        </div>
        <div className="divide-y divide-neutral-100">
          {campaigns.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-400">Nog geen acties aangemaakt.</div>
          )}
          {campaigns.map((c) => (
            <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 text-sm">@{c.snapchat_handle}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                    {c.code}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      c.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : c.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : c.status === "used"
                        ? "bg-neutral-100 text-neutral-500 line-through"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-1">{c.email}</div>
              </div>

              {/* Knoppen inclusief Override */}
              <div className="flex items-center gap-2">
                {c.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(c.id, "approve")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      title="Direct vrijgeven zonder op 6 uur te wachten"
                    >
                      <Zap className="h-3 w-3" /> Goedkeuren (Override)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(c.id, "reject")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-600 transition"
                    >
                      <XCircle className="h-3 w-3" /> Afkeuren
                    </button>
                  </>
                )}
                {c.status === "active" && (
                  <button
                    type="button"
                    onClick={() => handleRedeem(c.code)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition"
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