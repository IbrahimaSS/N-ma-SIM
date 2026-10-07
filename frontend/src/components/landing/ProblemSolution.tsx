import Image from "next/image";
import { ArrowDown, ScanFace, Bot, Mic, ShieldCheck, Smartphone } from "lucide-react";
import { Reveal } from "./Reveal";

const PROBLEM_PHOTOS = [
  { src: "/probleme-1.jpg", width: 794, height: 538, alt: "File d'attente à un guichet Orange Money à l'aéroport de Conakry" },
  { src: "/probleme-2.jpg", width: 1280, height: 698, alt: "Clients faisant la queue dans une agence Orange pour une carte SIM" },
  { src: "/probleme-3.jpg", width: 1080, height: 589, alt: "Agence Orange bondée, clients en attente devant les guichets" },
  { src: "/probleme-4.jpg", width: 1280, height: 720, alt: "Clients assis en salle d'attente dans une agence Orange" },
];

const REPERES = [
  { icon: ScanFace, title: "Identification", desc: "Scan de la pièce d'identité et extraction automatique des informations par IA." },
  { icon: Bot, title: "Agent IA", desc: "Un assistant guide le client à chaque étape de son parcours." },
  { icon: Mic, title: "Assistance vocale", desc: "Interaction possible à la voix, dans plusieurs langues locales." },
  { icon: ShieldCheck, title: "Paiement sécurisé", desc: "Transaction confirmée via Orange Money, Mobile Money ou carte bancaire." },
  { icon: Smartphone, title: "Distribution SIM", desc: "Carte physique délivrée sur place, ou eSIM activée numériquement." },
];

export function ProblemSolution() {
  return (
    <>
      {/* ── Le problème ── */}
      <section className="bg-white py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
              L&apos;accès aux services SIM reste un <span className="text-accent">défi majeur.</span>
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto mb-12">
              Déplacements, attente, horaires limités : chaque opération SIM passe encore par l&apos;agence.
            </p>
          </Reveal>

          <Reveal stagger={0.1} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-12">
            {PROBLEM_PHOTOS.map((photo) => (
              <div
                key={photo.src}
                className="group rounded-2xl overflow-hidden border border-border-light shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
              >
                <div className="overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    className="w-full h-52 sm:h-60 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col items-center gap-2">
            <ArrowDown size={18} className="text-accent" />
            <p className="text-base sm:text-lg font-bold text-primary">
              N&apos;ma SIM propose une nouvelle façon d&apos;y accéder.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── N'ma SIM, la solution ── */}
      <section id="solution" className="py-20 md:py-24" style={{ background: "#F4F7FC" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
              Une borne intelligente pensée pour <span className="text-accent">l&apos;autonomie.</span>
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Un seul équipement, plusieurs technologies embarquées pour un parcours entièrement autonome.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-[0.75fr_1fr] gap-10 lg:gap-14 items-center">
            <Reveal className="order-2 lg:order-1 flex justify-center">
              <div className="rounded-2xl overflow-hidden border border-border-light shadow-sm bg-white" style={{ width: "min(65vw, 280px)" }}>
                <Image src="/borne-maquette.png" alt="La borne N'ma SIM" width={640} height={1068} className="w-full h-auto" />
              </div>
            </Reveal>

            <Reveal stagger={0.08} className="order-1 lg:order-2 grid sm:grid-cols-2 gap-4">
              {REPERES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl p-5 border border-border-light shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-primary text-sm mb-1">{title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
