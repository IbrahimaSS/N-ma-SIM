import { CalendarCheck, QrCode, PackageCheck, KeyRound, BadgeCheck, CalendarClock } from "lucide-react";
import { Reveal } from "./Reveal";
import { ImagesPermutees } from "./ImagesPermutees";

const ETAPES_VOYAGEUR = [
  { icon: CalendarCheck, title: "Réservez avant de partir", desc: "Ajoutez une SIM N'ma SIM à votre réservation d'hôtel : SIM physique ou eSIM, avec forfait ou recharge." },
  { icon: QrCode, title: "Recevez votre code", desc: "Un reçu N'ma SIM vous est envoyé, avec votre code personnel et son QR code." },
  { icon: PackageCheck, title: "Récupérez votre SIM", desc: "À la borne, scannez votre reçu, puis votre passeport, et faites un selfie. Votre SIM est prête, déjà payée." },
];

const SECURITE = [
  { icon: KeyRound, label: "Code à usage unique" },
  { icon: BadgeCheck, label: "Passeport vérifié à la borne" },
  { icon: CalendarClock, label: "Valable 30 jours après l'arrivée" },
];

export function Voyageurs() {
  return (
    <section id="voyageurs" className="py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-14">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-accent/15 text-primary text-xs font-bold tracking-wide">
            NOUVEAU · SIM RÉSERVÉE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Votre SIM vous attend dès <span className="text-accent">l&apos;atterrissage.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Réservez votre carte SIM avec votre hôtel avant même de partir. À votre arrivée en Guinée, un simple code
            suffit pour la récupérer à la borne, sans file d&apos;attente ni paiement sur place.
          </p>
        </Reveal>

        {/* Parcours du voyageur (gauche) + photos (droite) */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <Reveal x={-36} className="rounded-3xl p-7 sm:p-9 bg-[#F4F7FC] flex flex-col justify-center">
            <h3 className="text-xl font-extrabold text-primary mb-6">Pour le voyageur</h3>
            <ol className="flex flex-col gap-6">
              {ETAPES_VOYAGEUR.map(({ icon: Icon, title, desc }, i) => (
                <li key={title} className="flex gap-4">
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-border-light shadow-sm flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-primary text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary">{title}</p>
                    <p className="text-sm text-text-muted leading-relaxed mt-1">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal x={36} className="h-full">
            {/* Les deux voyageuses échangent leur place en continu */}
            <ImagesPermutees
              className="h-full min-h-[360px]"
              images={[
                { src: "/voyageurs/voyageuse-aeroport.jpg", alt: "Voyageuse à l'aéroport, téléphone en main" },
                { src: "/voyageurs/voyageuse-valise.jpg", alt: "Voyageuse avec sa valise à l'arrivée" },
              ]}
            />
          </Reveal>
        </div>

        {/* Sécurité */}
        <Reveal stagger={0.08} className="mt-8 grid sm:grid-cols-3 gap-4">
          {SECURITE.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-border-light px-5 py-4">
              <Icon size={20} className="text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-primary">{label}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
