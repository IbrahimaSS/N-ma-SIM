"use client";
import { useState } from "react";
import { Smartphone, RefreshCcw, Wallet, ShieldCheck, ChevronDown, CreditCard, Wifi, Check } from "lucide-react";
import { Reveal } from "./Reveal";

const SERVICES = [
  {
    n: "01",
    icon: Smartphone,
    title: "Nouvelle SIM",
    desc: "Obtenez une nouvelle SIM et choisissez entre SIM physique ou eSIM.",
    esim: true,
  },
  {
    n: "02",
    icon: RefreshCcw,
    title: "Réactivation",
    desc: "Réactivez votre ligne à travers un parcours simple et guidé.",
  },
  {
    n: "03",
    icon: Wallet,
    title: "Recharge",
    desc: "Effectuez vos recharges directement depuis la borne.",
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Vérification",
    desc: "Vérifiez les informations et les cartes SIM associées à votre identité.",
  },
];

const ESIM_STEPS = [
  "Vérification de la compatibilité du téléphone",
  "Identification (scan de la pièce + extraction IA)",
  "Vérification du visage (selfie)",
  "Paiement sécurisé",
  "Génération et activation du profil eSIM",
];

const FORFAITS_DEMO = [
  { nom: "eSIM Starter", data: "3 Go", appels: "100 min", prix: "15 000 GNF" },
  { nom: "eSIM Pro", data: "8 Go", appels: "Illimité", prix: "25 000 GNF", populaire: true },
  { nom: "eSIM Illimité", data: "Illimité", appels: "Illimité", prix: "45 000 GNF" },
];

export function Services() {
  const [esimOpen, setEsimOpen] = useState(false);

  return (
    <section id="services" className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Quatre services. Une seule <span className="text-accent">expérience.</span>
          </h2>
        </Reveal>

        <Reveal stagger={0.08} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <div
              key={s.n}
              className="bg-white rounded-2xl p-6 border border-border-light shadow-sm flex flex-col hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <span className="text-xs font-black text-primary/25 mb-3">{s.n}</span>
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-4">
                <s.icon size={20} className="text-white" />
              </div>
              <h3 className="font-extrabold text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed flex-1">{s.desc}</p>

              {s.esim && (
                <button
                  onClick={() => setEsimOpen((v) => !v)}
                  className="mt-4 inline-flex items-center justify-between gap-2 text-xs font-bold text-primary bg-bg-light border border-border-light rounded-xl px-3.5 py-2.5 hover:border-primary/40 transition-colors"
                >
                  Choisissez votre format
                  <ChevronDown size={14} className={`transition-transform duration-200 ${esimOpen ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
          ))}
        </Reveal>

        {/* ── Sous-bloc dépliable : SIM physique | eSIM ── */}
        {esimOpen && (
          <div className="mt-6 bg-bg-light border border-border-light rounded-2xl p-6 sm:p-10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                  <CreditCard size={18} className="text-primary" />
                </div>
                <h4 className="font-extrabold text-primary mb-2">SIM physique</h4>
                <p className="text-sm text-text-muted leading-relaxed">
                  Carte délivrée directement par la borne, à récupérer sur place dès la fin du parcours.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Wifi size={18} className="text-primary" />
                </div>
                <h4 className="font-extrabold text-primary mb-2">eSIM</h4>
                <p className="text-sm text-text-muted leading-relaxed mb-3">
                  Parcours entièrement numérique, sans carte physique :
                </p>
                <ul className="space-y-1.5">
                  {ESIM_STEPS.map((step) => (
                    <li key={step} className="flex items-start gap-2 text-xs text-text-muted">
                      <Check size={13} className="text-success mt-0.5 flex-shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-text-muted/70 italic mt-3">
                  L&apos;activation finale dépend de l&apos;intégration avec l&apos;infrastructure de l&apos;opérateur.
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-primary/60 uppercase tracking-wide mb-4 text-center">
                Exemples de forfaits eSIM — offres du prototype
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {FORFAITS_DEMO.map((f) => (
                  <div
                    key={f.nom}
                    className={`bg-white rounded-2xl p-5 text-center border shadow-sm ${
                      f.populaire ? "border-primary" : "border-border-light"
                    }`}
                  >
                    {f.populaire && (
                      <span className="inline-block text-[10px] font-black text-white bg-primary rounded-full px-2.5 py-0.5 mb-2">
                        POPULAIRE
                      </span>
                    )}
                    <h5 className="font-extrabold text-primary text-sm mb-1">{f.nom}</h5>
                    <p className="text-2xl font-black text-primary mb-2">{f.prix}</p>
                    <p className="text-xs text-text-muted">{f.data} · {f.appels}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
