"use client";
import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

const VIDEO_DEMO = "/demo/nmasim-demo.mp4";
const AFFICHE_DEMO = "/demo/nmasim-demo.jpg";

/**
 * Bouton qui ouvre la vidéo de démonstration (parcours Nouvelle SIM commenté) dans une fenêtre
 * par-dessus la page. Remplace les liens vers /borne/accueil : le visiteur voit la borne en action
 * sans entrer dans l'espace client.
 */
export function BoutonVideoDemo({ className, children }: { className?: string; children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    const fermerSurEchap = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("keydown", fermerSurEchap);
    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // la page ne défile pas derrière la vidéo
    return () => {
      document.removeEventListener("keydown", fermerSurEchap);
      document.body.style.overflow = debordement;
    };
  }, [ouvert]);

  return (
    <>
      <button type="button" onClick={() => setOuvert(true)} className={className}>
        {children}
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vidéo de démonstration N'ma SIM"
          onClick={() => setOuvert(false)}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 sm:p-8"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label="Fermer la vidéo"
              className="absolute -top-11 right-0 flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-semibold"
            >
              Fermer <X size={20} />
            </button>
            <video
              src={VIDEO_DEMO}
              poster={AFFICHE_DEMO}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="w-full max-h-[80vh] rounded-2xl bg-black shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
