import { Network, Workflow, Smile, Building2 } from "lucide-react";
import { Reveal } from "./Reveal";

const BENEFICES = [
  { icon: Network, title: "Étendre les points de service", desc: "Multiplier les points d'accès sans ouvrir de nouvelles agences physiques." },
  { icon: Workflow, title: "Automatiser certaines opérations", desc: "Confier à la borne les tâches répétitives : scan, vérification, paiement." },
  { icon: Smile, title: "Améliorer l'expérience client", desc: "Un parcours rapide, guidé et disponible en dehors des horaires d'agence." },
  { icon: Building2, title: "Réduire la pression sur les agences", desc: "Désengorger les guichets en déportant les demandes courantes vers la borne." },
];

export function Operators() {
  return (
    <section id="operateurs" className="py-20 md:py-24" style={{ background: "#F4F7FC" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Une solution pensée pour les <span className="text-accent">opérateurs télécoms.</span>
          </h2>
        </Reveal>

        <Reveal stagger={0.08} className="grid sm:grid-cols-2 gap-4">
          {BENEFICES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 p-6 rounded-2xl bg-white border border-border-light shadow-sm hover:border-primary/25 hover:shadow-md transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-primary mb-1.5">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
