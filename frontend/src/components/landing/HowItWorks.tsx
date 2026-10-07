import { MousePointerClick, IdCard, ScanFace, ListChecks, Wallet, PackageCheck } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  { icon: MousePointerClick, title: "Choisir", desc: "Le service souhaité et la langue." },
  { icon: IdCard, title: "S'identifier", desc: "Scan de la pièce, extraction automatique des informations." },
  { icon: ScanFace, title: "Vérifier", desc: "Comparaison faciale pour confirmer l'identité." },
  { icon: ListChecks, title: "Choisir son offre", desc: "Formule adaptée au besoin du client." },
  { icon: Wallet, title: "Payer", desc: "Paiement sécurisé depuis la borne." },
  { icon: PackageCheck, title: "Recevoir / Activer", desc: "Carte SIM délivrée ou eSIM activée." },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-20 md:py-24" style={{ background: "#F4F7FC" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Simple à utiliser. Clair à chaque <span className="text-accent">étape.</span>
          </h2>
        </Reveal>

        <Reveal stagger={0.08} className="relative grid sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-4">
          <div className="hidden lg:block absolute top-7 left-[calc(100%/12)] right-[calc(100%/12)] h-px bg-border-light" />

          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-white border border-border-light shadow-sm flex items-center justify-center mb-4">
                <Icon size={22} className="text-primary" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-primary text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-extrabold text-primary text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-text-muted leading-relaxed max-w-[150px]">{desc}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
