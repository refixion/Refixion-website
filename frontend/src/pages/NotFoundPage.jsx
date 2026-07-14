import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-[13px] uppercase tracking-wider text-[#666666]">404</div>
        <h1 className="mt-3 text-5xl md:text-6xl tracking-tight font-semibold text-[#111111]">Pagina niet gevonden.</h1>
        <p className="mt-4 text-lg text-[#666666]">De pagina die je zoekt bestaat niet meer of is verplaatst.</p>
        <Link to="/" data-testid="notfound-home" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111111] text-white px-6 py-3 text-[14px] font-medium">Naar home</Link>
      </div>
    </div>
  );
}
