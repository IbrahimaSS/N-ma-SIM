import Link from "next/link";
import { PlayCircle, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function DemoSection() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Découvrez N&apos;ma SIM en <span className="text-accent">action.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Essayez directement le parcours réel de la borne, tel qu&apos;il fonctionne aujourd&apos;hui.
          </p>
        </Reveal>

        <Reveal>
          <Link
            href="/borne/accueil"
            className="flex flex-col items-center justify-center text-center px-8 py-16 sm:py-20 rounded-2xl border border-border-light shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
            style={{ background: "#F4F7FC" }}
          >
            <span className="w-16 h-16 rounded-full bg-white border border-border-light flex items-center justify-center shadow-sm mb-6">
              <PlayCircle size={28} className="text-primary" />
            </span>
            <p className="text-primary font-bold text-lg mb-1">Lancer la démonstration</p>
            <p className="text-text-muted text-sm flex items-center gap-1.5">
              Interface complète de la borne, dans votre navigateur <ArrowRight size={14} />
            </p>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
