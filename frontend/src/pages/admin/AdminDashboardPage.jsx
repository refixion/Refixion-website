import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Calendar, CheckCircle2, Clock, Package, Bell, BellRing } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const STATUS_LABEL = { pending: "In afwachting", confirmed: "Bevestigd", in_progress: "Bezig", ready: "Klaar voor afhalen", completed: "Afgerond", cancelled: "Geannuleerd" };

// Helper om base64 string om te zetten naar Uint8Array voor pushManager
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

  useEffect(() => {
    api.get("/admin/bookings/stats").then((r) => setStats(r.data));
    api.get("/admin/bookings").then((r) => setRecent(r.data.slice(0, 6)));

    // Service worker registreren bij openen van het dashboard
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration error:", err);
      });
    }

    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, []);

  const handleEnablePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Pushmeldingen worden niet ondersteund in deze browser (open de app vanaf je iPhone beginscherm).");
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Geen toestemming gegeven voor meldingen in iOS.");
        setSubscribing(false);
        return;
      }

      // Haal publieke VAPID sleutel op
      const vapidRes = await api.get("/admin/vapid-public-key");
      const publicKey = vapidRes.data.publicKey;
      if (!publicKey) {
        toast.error("VAPID_PUBLIC_KEY ontbreekt in backend configuratie.");
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

      // Stuur subscription naar backend
      await api.post("/admin/subscribe-push", subscription.toJSON());
      setPushEnabled(true);
      toast.success("Pushmeldingen succesvol geactiveerd voor deze telefoon!");
    } catch (e) {
      console.error(e);
      toast.error("Kon meldingen niet inschakelen.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleTestPush = async () => {
    try {
      toast.info("Test push versturen...");
      const res = await api.post("/admin/test-push");
      if (res.data.status === "ok") {
        toast.success("Test-signaal verzonden naar de backend!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Fout bij aanroepen test-push.");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl tracking-tight font-semibold text-[#111111]">Dashboard.</h1>
          <p className="mt-2 text-[14px] text-[#666666]">Een snel overzicht van je operatie.</p>
        </div>

        {/* Knoppen voor meldingen en test */}
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
            disabled={subscribing || pushEnabled}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px] sm:text-[13px] font-medium transition-all border ${
              pushEnabled
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 active:scale-95 shadow-sm"
            }`}
          >
            {pushEnabled ? (
              <>
                <BellRing className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>iPhone Meldingen actief</span>
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