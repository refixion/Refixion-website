import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Home, RotateCcw } from "lucide-react";

export default function BookingSuccessPage() {
  const [params] = useSearchParams();
  const ref = params.get("ref");
  return (
    <div className="min-h-screen bg-white flex items-center">
      <div className="container-page py-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            data-testid="booking-success-check"
            className="mx-auto h-20 w-20 rounded-full bg-[#111111] flex items-center justify-center"
          >
            <Check className="h-10 w-10 text-white" strokeWidth={2} />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 text-4xl md:text-5xl tracking-tight font-semibold text-[#111111]">
            Boeking succesvol.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 text-lg text-[#666666]">
            Bedankt. We hebben je reparatieverzoek ontvangen{ref ? <> — referentie <span className="text-[#111111] font-medium">{ref}</span>.</> : "."}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3 text-[15px] text-[#666666]">
            Een bevestigingsmail is naar je inbox verzonden. We nemen contact met je op als er iets verandert.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 flex items-center gap-3 justify-center">
            <Link to="/" data-testid="success-home-btn" className="inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#333]">
              <Home className="h-4 w-4" strokeWidth={1.5} /> Naar home
            </Link>
            <Link to="/booking" data-testid="success-another-btn" className="inline-flex items-center gap-2 rounded-full bg-white text-[#111111] border border-[#EAEAEA] px-6 py-3 text-[14px] font-medium hover:bg-[#FAFAFA]">
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} /> Nog een boeking
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
