import React from "react";
import { Section } from "../components/site/primitives";

const CONTENT = {
  privacy: {
    title: "Privacybeleid",
    intro:
      "Refixion respecteert jouw privacy en gaat zorgvuldig om met persoonsgegevens. In dit privacybeleid leggen we uit welke gegevens we verwerken, waarom we dat doen en hoe we hiermee omgaan.",
    sections: [
      {
        title: "Welke gegevens verwerken wij?",
        body: [
          "Bij het maken van een reparatieafspraak of het plaatsen van een bestelling kunnen wij onder andere je naam, e-mailadres, telefoonnummer en adresgegevens verwerken.",
          "Deze gegevens gebruiken wij om je afspraak of bestelling uit te voeren, contact met je op te nemen en je op de hoogte te houden van de voortgang.",
        ],
      },
      {
        title: "Waarvoor gebruiken wij je gegevens?",
        body: [
          "Wij gebruiken persoonsgegevens uitsluitend voor zover dat nodig is voor onze dienstverlening, waaronder het verwerken van afspraken, bestellingen, betalingen en communicatie hierover.",
          "Wanneer je ons een e-mail stuurt, gebruiken wij de verstrekte gegevens om op je bericht te reageren.",
        ],
      },
      {
        title: "Met wie delen wij gegevens?",
        body: [
          "Wij delen persoonsgegevens niet zomaar met derden. Wanneer externe dienstverleners nodig zijn om onze dienstverlening uit te voeren, kan het noodzakelijk zijn om daarvoor bepaalde gegevens met hen te delen.",
          "Voor betalingen en verzending kunnen bijvoorbeeld externe betaaldienstverleners en vervoerders worden gebruikt.",
        ],
      },
      {
        title: "Bewaartermijn",
        body: [
          "Wij bewaren persoonsgegevens niet langer dan noodzakelijk is voor het doel waarvoor ze zijn verzameld, tenzij een wettelijke verplichting ons verplicht om gegevens langer te bewaren.",
        ],
      },
      {
        title: "Jouw rechten",
        body: [
          "Je kunt onder voorwaarden verzoeken om inzage, correctie of verwijdering van je persoonsgegevens. Ook kun je bezwaar maken tegen bepaalde verwerkingen.",
          "Voor vragen over privacy kun je contact opnemen via info@refixion.nl.",
        ],
      },
    ],
  },

  terms: {
    title: "Algemene voorwaarden",
    intro:
      "Deze algemene voorwaarden zijn van toepassing op de diensten en producten die Refixion aanbiedt via de website en op locatie.",
    sections: [
      {
        title: "1. Reparaties",
        body: [
          "Reparaties worden uitgevoerd op afspraak. Vooraf wordt, waar mogelijk, aangegeven welke reparatie wordt uitgevoerd en tegen welke prijs.",
          "De uiteindelijke reparatie kan afhankelijk zijn van de staat van het toestel en eventuele aanvullende schade die pas tijdens het onderzoek zichtbaar wordt. Wanneer een aanvullende reparatie of meerprijs noodzakelijk is, wordt dit vooraf met de klant besproken.",
        ],
      },
      {
        title: "2. Garantie op reparaties",
        body: [
          "Op reparaties en gebruikte onderdelen geldt een garantie van 12 maanden, tenzij voor een specifiek onderdeel of product uitdrukkelijk een andere termijn wordt vermeld.",
          "Op schermreparaties geldt voor een goed/OEM-scherm een garantie van 12 maanden. Voor een goedkoop LCD-scherm geldt een garantie van 3 maanden.",
          "Garantie geldt voor gebreken die niet door verkeerd gebruik of externe schade zijn ontstaan.",
          "Garantie vervalt onder andere bij val- of stootschade, waterschade, gebruikersschade, onjuist gebruik of wanneer het toestel door de klant zelf of door een andere reparateur is geopend of gerepareerd.",
        ],
      },
      {
        title: "3. Verkoop van refurbished telefoons",
        body: [
          "Refixion verkoopt gereviseerde en gecontroleerde smartphones. Per toestel kan de cosmetische staat verschillen. Eventuele relevante kenmerken of gebruikssporen worden bij het product vermeld.",
          "De telefoon wordt geleverd met de specificaties en accessoires die op de productpagina of tijdens het bestelproces zijn vermeld.",
        ],
      },
      {
        title: "4. Betaling",
        body: [
          "Betaling van online bestellingen vindt plaats via de beschikbare betaalmethoden tijdens het afrekenen.",
          "Een bestelling wordt verwerkt nadat de betaling succesvol is afgerond, tenzij anders met de klant is afgesproken.",
        ],
      },
      {
        title: "5. Verzending",
        body: [
          "Bestellingen worden in Nederland verzonden via PostNL. De verwachte levertijd bedraagt doorgaans 2 tot 5 werkdagen.",
          "Zodra een bestelling is verzonden, ontvangt de klant indien beschikbaar informatie waarmee de zending kan worden gevolgd.",
        ],
      },
      {
        title: "6. Afspraken en annulering",
        body: [
          "Reparaties worden uitgevoerd op afspraak. Wanneer een klant verhinderd is, verzoeken wij om de afspraak zo vroeg mogelijk te annuleren of te verplaatsen.",
        ],
      },
      {
        title: "7. Aansprakelijkheid",
        body: [
          "Refixion voert reparaties met de nodige zorg uit. Bij reparaties aan bestaande toestellen kan echter niet worden uitgesloten dat reeds aanwezige of verborgen schade tijdens het onderzoek of de reparatie zichtbaar wordt.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookiebeleid",
    intro:
      "Refixion gebruikt cookies en vergelijkbare technieken voor de werking van de website.",
    sections: [
      {
        title: "Functionele cookies",
        body: [
          "Functionele cookies en lokale opslag kunnen worden gebruikt om onderdelen van de website goed te laten werken, bijvoorbeeld om gegevens tijdens het gebruik van de website te onthouden.",
        ],
      },
      {
        title: "Analytische en trackingcookies",
        body: [
          "Wij plaatsen niet zonder meer trackingcookies. Wanneer voor bepaalde diensten toestemming nodig is, wordt deze toestemming gevraagd voordat dergelijke cookies worden geplaatst.",
        ],
      },
      {
        title: "Cookies verwijderen",
        body: [
          "Je kunt cookies via de instellingen van je browser verwijderen of blokkeren. Hierdoor kunnen bepaalde onderdelen van de website mogelijk minder goed functioneren.",
        ],
      },
    ],
  },

  returns: {
    title: "Retourneren & herroepen",
    intro:
      "Heb je online een refurbished telefoon of ander product bij Refixion gekocht? Dan heb je als consument in de meeste gevallen het recht om je aankoop binnen 14 dagen na ontvangst zonder opgave van reden te herroepen.",
    sections: [
      {
        title: "14 dagen bedenktijd",
        body: [
          "De bedenktijd begint op de dag nadat jij, of een door jou aangewezen derde die niet de vervoerder is, het product hebt ontvangen.",
          "Binnen deze termijn mag je beslissen of je de aankoop wilt houden. Je hoeft daarvoor geen reden op te geven.",
        ],
      },
      {
        title: "Hoe meld ik een retour?",
        body: [
          "Wil je gebruikmaken van je herroepingsrecht? Meld dit dan binnen de bedenktijd bij Refixion via info@refixion.nl.",
          "Vermeld bij je melding bij voorkeur je naam, ordernummer en welk product je wilt retourneren.",
          "Na je retourmelding moet je het product zo snel mogelijk en uiterlijk binnen 14 dagen terugsturen.",
        ],
      },
      {
        title: "Staat van het product",
        body: [
          "Je mag het product bekijken en beoordelen zoals je dat in een winkel zou mogen doen.",
          "Je bent aansprakelijk voor waardevermindering wanneer je het product verder gebruikt dan nodig is om de aard, kenmerken en werking ervan vast te stellen.",
          "Bij een smartphone betekent dit onder andere dat je zorgvuldig moet omgaan met het toestel en het niet onnodig beschadigt of gebruikt.",
        ],
      },
      {
        title: "Terugbetaling",
        body: [
          "Na een geldige herroeping betaalt Refixion de ontvangen betaling terug, inclusief de standaard verzendkosten van de oorspronkelijke bestelling.",
          "Wij mogen wachten met terugbetalen totdat wij het product hebben teruggekregen of totdat je hebt aangetoond dat je het product hebt teruggestuurd.",
          "Voor de terugbetaling gebruiken wij in beginsel dezelfde betaalmethode als waarmee de oorspronkelijke betaling is gedaan.",
        ],
      },
      {
        title: "Retourkosten",
        body: [
          "De kosten voor het terugsturen van een product zijn voor rekening van de klant, tenzij anders is afgesproken of het product gebrekkig of verkeerd geleverd is.",
        ],
      },
      {
        title: "Uitzonderingen",
        body: [
          "Het herroepingsrecht kent wettelijke uitzonderingen. Wanneer een uitzondering van toepassing is, wordt dit vóór of tijdens het bestellen duidelijk aangegeven.",
        ],
      },
      {
        title: "Reparaties",
        body: [
          "Deze retourprocedure is bedoeld voor producten die online zijn gekocht, zoals refurbished telefoons. Een reparatieafspraak is een dienst en valt niet automatisch onder dezelfde retourprocedure.",
          "Heb je een probleem met een uitgevoerde reparatie of wil je een afspraak annuleren? Neem dan contact op via info@refixion.nl.",
        ],
      },
      {
        title: "Contact",
        body: [
          "Voor retouren, herroeping of vragen over een bestelling kun je contact opnemen via info@refixion.nl.",
          "Refixion",
          "KvK: 42131896",
        ],
      },
    ],
  },
};

export default function LegalPage({ kind }) {
  const c = CONTENT[kind];

  if (!c) {
    return (
      <Section>
        <div className="max-w-3xl mx-auto py-16">
          <h1 className="text-3xl font-semibold text-[#111111]">
            Pagina niet gevonden
          </h1>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="max-w-3xl mx-auto py-12 md:py-16">
        <div className="text-[12px] uppercase tracking-wider text-[#666666] font-medium mb-4">
          Refixion · Juridisch
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#111111]">
          {c.title}
        </h1>

        <p className="mt-5 text-[15px] leading-7 text-[#555555]">
          {c.intro}
        </p>

        <div className="mt-10 space-y-8">
          {c.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-lg font-semibold text-[#111111]">
                {section.title}
              </h2>

              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="text-[14px] leading-7 text-[#555555]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[#EAEAEA] text-[12px] text-[#999999]">
          Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}
        </div>
      </div>
    </Section>
  );
}