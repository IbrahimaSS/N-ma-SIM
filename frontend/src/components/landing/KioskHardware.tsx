import Image from "next/image";
import { MonitorSmartphone, Camera, Printer, CreditCard, ShieldCheck, Settings2 } from "lucide-react";
import { Reveal } from "./Reveal";

const MATERIEL = [
  { icon: Camera, title: "Caméra HD", desc: "Capture du document d'identité et du selfie pour la vérification faciale." },
  { icon: MonitorSmartphone, title: "Écran tactile 24\"", desc: "Interface large et intuitive, pensée pour un usage debout, en autonomie complète." },
  { icon: Printer, title: "Imprimante / scanner", desc: "Un seul équipement combiné : numérisation de la pièce et impression du reçu." },
  { icon: CreditCard, title: "Distributeur de SIM", desc: "Délivrance de la carte physique à hauteur ergonomique, accessible à tous." },
  { icon: ShieldCheck, title: "Châssis sécurisé", desc: "Structure robuste, pensée pour un usage en continu sur le terrain." },
  { icon: Settings2, title: "Électronique embarquée", desc: "Pilotage du matériel (caméra, impression, distribution) directement depuis la borne." },
];

export function KioskHardware() {
  return (
    <section id="borne" className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Une technologie pensée pour le <span className="text-accent">terrain.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Un équipement unique, robuste, conçu pour fonctionner en autonomie dans un point de passage.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.7fr_1fr] gap-10 lg:gap-14 items-center">
          <Reveal className="flex justify-center">
            <div className="rounded-2xl overflow-hidden border border-border-light shadow-sm bg-white" style={{ width: "min(70vw, 320px)" }}>
              <Image src="/borne-maquette.png" alt="Matériel de la borne N'ma SIM" width={640} height={1068} className="w-full h-auto" />
            </div>
          </Reveal>

          <Reveal stagger={0.08} className="grid sm:grid-cols-2 gap-4">
            {MATERIEL.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-border-light rounded-2xl p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-extrabold text-primary mb-1.5">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
