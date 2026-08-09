```jsx
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { Section } from "../components/site/primitives";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

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
```
