import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Section } from "../components/site/primitives";
import { api } from "../lib/api";
import { clearCart } from "../lib/cart";

const CHECKOUT_DRAFT_KEY = "refixion_checkout_draft_v1";
const CART_CLEAR_KEY = "refixion_cart_cleared_success_v1";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    try {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setStatus("missing");
      return;
    }

    let alive = true;

    const verifyPayment = async () => {
      try {
        const res = await api.get(`/shop/orders/session/${encodeURIComponent(sessionId)}`);
        if (!alive) return;

        if (res.data?.paid) {
          const alreadyCleared = sessionStorage.getItem(CART_CLEAR_KEY) === "1";
          if (!alreadyCleared) {
            clearCart();
            sessionStorage.setItem(CART_CLEAR_KEY, "1");
          }
          setStatus("paid");
          return;
        }

        setStatus("pending");
      } catch {
        if (!alive) return;
        setStatus("pending");
      }
    };

    verifyPayment();

    return () => {
      alive = false;
    };
  }, [sessionId]);

  if (status === "checking") {
    return (
      <Section>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="h-14 w-14 rounded-full bg-[#111111] flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 text-white animate-spin" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#111111]">Betaling controleren...</h1>
          <p className="mt-2 text-[14px] text-[#666666]">We bevestigen nog even de Stripe-status voordat we je bestelling afsluiten.</p>
        </div>
      </Section>
    );
  }

  if (status === "pending") {
    return (
      <Section>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="h-14 w-14 rounded-full bg-[#111111] flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 text-white animate-spin" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#111111]">Betaling in verwerking</h1>
          <p className="mt-2 text-[14px] text-[#666666]">Je bestelling is nog niet definitief bevestigd. Je winkelmand blijft bewaard.</p>
          {sessionId && (
            <p className="mt-4 text-[11px] text-[#BBBBBB] break-all">Betalingskenmerk: {sessionId}</p>
          )}
          <Link to="/cart" className="mt-8 inline-flex rounded-full border border-[#EAEAEA] px-6 py-3 text-[14px] font-medium text-[#111111] hover:bg-[#FAFAFA]">Naar winkelwagen</Link>
        </div>
      </Section>
    );
  }

  if (status === "missing") {
    return (
      <Section>
        <div className="max-w-lg mx-auto text-center py-16">
          <h1 className="mt-6 text-2xl font-semibold text-[#111111]">Betalingsstatus onvolledig</h1>
          <p className="mt-2 text-[14px] text-[#666666]">Er kon geen Stripe-betalingskenmerk worden gevonden. Je bestelling wordt niet automatisch verwerkt.</p>
          <Link to="/cart" className="mt-8 inline-flex rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]">Naar winkelwagen</Link>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="h-14 w-14 rounded-full bg-[#111111] flex items-center justify-center mx-auto">
          <Check className="h-6 w-6 text-white" strokeWidth={2} />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-[#111111]">
          Betaling geslaagd!
        </h1>

        <p className="mt-2 text-[14px] text-[#666666]">
          Bedankt voor je bestelling bij Refixion.
          Je betaling is succesvol ontvangen.
        </p>

        <p className="mt-4 text-[13px] text-[#999999]">
          We gaan je bestelling verwerken en nemen indien nodig contact met
          je op.
        </p>

        {sessionId && (
          <p className="mt-4 text-[11px] text-[#BBBBBB] break-all">
            Betalingskenmerk: {sessionId}
          </p>
        )}

        <Link
          to="/shop"
          className="mt-8 inline-flex rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]"
        >
          Verder winkelen
        </Link>
      </div>
    </Section>
  );
}
