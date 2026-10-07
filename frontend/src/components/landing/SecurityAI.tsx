import { IdCard, ScanText, UserRoundSearch, GitCompareArrows, BadgeCheck, XCircle, CheckCircle2 } from "lucide-react";
import { Reveal } from "./Reveal";

const FLOW = [
  { icon: IdCard, title: "Pièce d'identité" },
  { icon: ScanText, title: "Extraction" },
  { icon: UserRoundSearch, title: "Selfie" },
  { icon: GitCompareArrows, title: "Comparaison" },
  { icon: BadgeCheck, title: "Validation" },
];

export function SecurityAI() {
  return (
    <section id="securite" className="bg-white py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Votre identité, notre <span className="text-accent">priorité.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Chaque demande passe par une vérification d&apos;identité automatisée, pensée pour fiabiliser chaque transaction.
          </p>
        </Reveal>

        {/* Flux */}
        <Reveal stagger={0.08} className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-14">
          {FLOW.map(({ icon: Icon, title }, i) => (
            <div key={title} className="flex items-center gap-3 sm:gap-5">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl border border-border-light flex items-center justify-center" style={{ background: "#F4F7FC" }}>
                  <Icon size={24} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-primary">{title}</span>
              </div>
              {i < FLOW.length - 1 && (
                <div className="hidden sm:block w-8 h-px bg-border-light" />
              )}
            </div>
          ))}
        </Reveal>

        {/* Mini-démonstration */}
        <Reveal delay={0.1} stagger={0.1} className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <div className="rounded-2xl p-5 border border-border-light flex items-start gap-3" style={{ background: "#F4F7FC" }}>
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <XCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-sm text-text-main mb-1">Visage non concordant</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Si le selfie ne correspond pas à la photo de la pièce d&apos;identité, la demande est automatiquement refusée.
              </p>
            </div>
          </div>
          <div className="rounded-2xl p-5 border border-border-light flex items-start gap-3" style={{ background: "#F4F7FC" }}>
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <div>
              <p className="font-bold text-sm text-text-main mb-1">Titulaire reconnu</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Dès que la correspondance est confirmée, le parcours se poursuit automatiquement.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
