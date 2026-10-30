import { PlayCircle, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { BoutonVideoDemo } from "./BoutonVideoDemo";

export function DemoSection() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Découvrez N&apos;ma SIM en <span className="text-accent">action.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Suivez en vidéo le parcours complet d&apos;un client, de l&apos;accueil jusqu&apos;à sa nouvelle carte SIM.
          </p>
        </Reveal>

        <Reveal>
          <BoutonVideoDemo
            className="w-full flex flex-col items-center justify-center text-center px-8 py-16 sm:py-20 rounded-2xl border border-border-light shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 bg-cover bg-center relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-[url('/demo/nmasim-demo.jpg')] bg-cover bg-center opacity-25" aria-hidden />
            <span className="absolute inset-0 bg-[#F4F7FC]/70" aria-hidden />
            <span className="relative w-16 h-16 rounded-full bg-white border border-border-light flex items-center justify-center shadow-sm mb-6">
              <PlayCircle size={28} className="text-primary" />
            </span>
            <span className="relative text-primary font-bold text-lg mb-1">Lancer la démonstration</span>
            <span className="relative text-text-muted text-sm flex items-center gap-1.5">
              Vidéo commentée du parcours Nouvelle SIM, environ 3 minutes <ArrowRight size={14} />
            </span>
          </BoutonVideoDemo>
        </Reveal>
      </div>
    </section>
  );
}
