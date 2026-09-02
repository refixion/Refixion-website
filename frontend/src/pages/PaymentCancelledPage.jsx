import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Section } from "../components/site/primitives";

const CHECKOUT_DRAFT_KEY = "refixion_checkout_draft_v1";

export default function PaymentCancelledPage() {
  const navigate = useNavigate();

  const handleBackToCheckout = () => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      const draft = raw ? JSON.parse(raw) : null;
      const nextDraft = {
        ...(draft || {}),
        step: 3,
        termsAccepted: false,
      };
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(nextDraft));
    } catch {
      // noop
    }

    navigate("/checkout");
  };

  return (
    <Section>
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="h-14 w-14 rounded-full bg-[#111111] flex items-center justify-center mx-auto">
          <XCircle className="h-6 w-6 text-white" strokeWidth={2} />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-[#111111]">
          Betaling geannuleerd
        </h1>

        <p className="mt-2 text-[14px] text-[#666666]">
          Er is geen betaling ontvangen. Je bestelling is niet afgerond en er is geen factuur aangemaakt.
        </p>

        <p className="mt-4 text-[13px] text-[#999999]">
          Je kunt altijd opnieuw proberen of teruggaan naar je winkelwagen. Je ingevulde gegevens worden bewaard zodat je direct weer verder kunt.
        </p>

        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleBackToCheckout}
            className="inline-flex rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]"
          >
            Terug naar checkout
          </button>
          <Link
            to="/cart"
            className="inline-flex rounded-full border border-[#EAEAEA] px-6 py-3 text-[14px] font-medium text-[#111111] hover:bg-[#FAFAFA]"
          >
            Naar winkelwagen
          </Link>
        </div>
      </div>
    </Section>
  );
}
