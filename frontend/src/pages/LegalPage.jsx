import React from "react";
import { Link } from "react-router-dom";
import { FadeUp, Section } from "../components/site/primitives";

const CONTENT = {
  privacy: { title: "Privacybeleid", body: "Refixion verwerkt persoonsgegevens uitsluitend om je reparatieboeking uit te voeren en met je te communiceren. We delen geen data met derden. Voor vragen: hello@refixion.nl." },
  terms: { title: "Algemene voorwaarden", body: "Onze reparaties worden uitgevoerd met de grootste zorg. Op schermreparaties geven wij levenslange garantie op het onderdeel. Op overige onderdelen 12 maanden garantie. Waterschade en fysieke schade zijn uitgesloten van garantie." },
  cookies: { title: "Cookiebeleid", body: "Wij gebruiken alleen functionele cookies die nodig zijn voor de werking van de website. Wij plaatsen geen tracking cookies zonder toestemming." },
};

export default function LegalPage({ kind }) {
  const c = CONTENT[kind];
  return (
    <div className="bg-white">
      <Section>
        <FadeUp>
          <div className="text-[12px] uppercase tracking-wider text-[#666666]">Refixion · Juridisch</div>
          <h1 className="mt-3 text-4xl md:text-5xl tracking-tight font-semibold text-[#111111]">{c.title}</h1>
          <p className="mt-8 max-w-3xl text-lg text-[#666666] leading-relaxed">{c.body}</p>
          <p className="mt-6 text-[14px] text-[#666666]">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}. Voor vragen <Link to="/contact" className="underline">contact opnemen</Link>.</p>
        </FadeUp>
      </Section>
    </div>
  );
}
