import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Calendar, CheckCircle2, Clock, Package, Bell, BellRing } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const STATUS_LABEL = { 
  pending: "In afwachting", 
  confirmed: "Bevestigd", 
  in_progress: "Bezig", 
  ready: "Klaar voor afhalen", 
  completed: "Afgerond", 
  cancelled: "Geannuleerd" 
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Registreer service worker en synchroniseer subscription bij het laden
  useEffect(() => {
    api.get("/admin/bookings/stats").then((r) => setStats(r.data));
    api.get("/admin/bookings").then((r) => setRecent(r.data.slice(0, 6)));

    const initPush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();

        if (sub && Notification.permission === "granted") {
          await api.post("/admin/subscribe-push", sub.toJSON());
          setPushEnabled(true);
        }
      } catch (err) {
        console.error("SW / Push init error:", err);
      }
    };

    initPush();
  }, []);

  const handleEnablePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Open deze pagina via de app op je iPhone beginscherm.");
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Geen toestemming gegeven in iOS Instellingen.");
        setSubscribing(false);
        return;
      }

      const vapidRes = await api.get("/admin/vapid-public-key");
      const publicKey = vapidRes.data.publicKey;
      if (!publicKey) {
        toast.error("VAPID_PUBLIC_KEY ontbreekt in backend.");
        setSubscribing(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // Opslaan in Supabase via backend
      const saveRes = await api.post("/admin/subscribe-push", subscription.toJSON());
      if (saveRes.data.status === "ok") {
        setPushEnabled(true);
        toast.success(`Succesvol gekoppeld! (${saveRes.data.total} apparaat/apparaten geregistreerd)`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Koppelen mislukt: " + (e.message || "onbekende fout"));
    } finally {
      setSubscribing(false);
    }
  };

  const handleTestPush = async () => {
    try {
      toast.info("Test push versturen...");
      const res = await api.post("/admin/test-push");
      if (res.data.status === "ok") {
        toast.success("Verzoek verzonden naar backend!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Fout bij test-push.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-1 sm:px-0 pb-12">
      {/* Header sectie met knoppen */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl tracking-tight font-bold text-[#111111]">Dashboard</h1>
          <p className="mt-1 text-[13px] sm:text-[14px] text-neutral-500">Overzicht van je reparatie operatie.</p>
        </div>

        <div className="flex items-center gap-2">
          {pushEnabled && (
            <button
              type="button"
              onClick={handleTestPush}
              className="rounded-xl px-3.5 py-2.5 text-[12px] sm:text-[13px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors"
            >
              Stuur test melding
            </button>
          )}

          <button
            type="button"
            onClick={handleEnablePush}
            disabled={subscribing}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px] sm:text-[13px] font-medium transition-all border ${
              pushEnabled
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 active:scale-95 shadow-sm"
            }`}
          >
            {pushEnabled ? (
              <>
                <BellRing className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{subscribing ? "Bezig..." : "Opnieuw koppelen"}</span>
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5 shrink-0" />
                <span>{subscribing ? "Koppelen..." : "Meldingen aanzetten"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistieken Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {[
          { k: "total", label: "Totaal", value: stats?.total ?? "—", Icon: Package },
          { k: "today", label: "Vandaag", value: stats?.today ?? "—", Icon: Calendar },
          { k: "pending", label: "In afwachting", value: stats?.by_status?.pending ?? 0, Icon: Clock },
          { k: "completed", label: "Afgerond", value: stats?.by_status?.completed ?? 0, Icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl bg-white border border-neutral-200/80 p-3.5 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{s.label}</span>
              <s.Icon className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.8} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recente Boekingen Kaart */}
      <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3.5 sm:p-5 flex items-center justify-between border-b border-neutral-100">
          <div className="text-[14px] sm:text-[15px] font-semibold text-neutral-900">Recente boekingen</div>
          <Link to="/admin/bookings" className="text-[12px] sm:text-[13px] font-medium text-neutral-600 hover:text-black">
            Alle bekijken →
          </Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {recent.length === 0 && (
            <div className="p-6 text-center text-[13px] text-neutral-500">Nog geen boekingen gevonden.</div>
          )}
          {recent.map((b) => (
            <div key={b.id} className="p-3.5 sm:p-5 flex items-center justify-between gap-3 hover:bg-neutral-50/50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] sm:text-[14px] font-semibold text-neutral-900 truncate">
                    {b.first_name} {b.last_name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                    {b.reference}
                  </span>
                </div>
                <div className="text-[12px] text-neutral-500 mt-0.5 truncate">
                  {b.brand_name} {b.device_name} · <span className="text-neutral-700">{b.repair_name}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] sm:text-[13px] font-medium text-neutral-900">
                  {b.appointment_date?.split("-").slice(1).reverse().join("/")} · {b.appointment_time}
                </div>
                <div className="text-[11px] font-medium text-neutral-500 mt-0.5">
                  {STATUS_LABEL[b.status] || b.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}