import { Building2, Heart, ListChecks, Lock, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { CarrouselImages } from "./CarrouselImages";

const AVANTAGES_HOTEL = [
  { icon: Building2, title: "Un espace dédié", desc: "Chaque hôtel dispose de son propre accès pour créer les réservations SIM de ses clients." },
  { icon: Heart, title: "Un service en plus pour vos clients", desc: "Vos voyageurs arrivent connectés et l'esprit libre." },
  { icon: ListChecks, title: "Un suivi en temps réel", desc: "Retrouvez chaque réservation et son statut : active, utilisée, expirée." },
  { icon: Lock, title: "Un accès limité", desc: "Chaque hôtel ne voit que ses propres réservations." },
];

const IMAGES_HOTEL = [
  { src: "/voyageurs/hotel-piscine.jpg", alt: "Piscine d'un hôtel en bord de mer" },
  { src: "/voyageurs/hotel-piscine-soir.jpg", alt: "Hôtel et sa piscine en soirée" },
  { src: "/voyageurs/hotel-chambre.jpg", alt: "Chambre d'hôtel" },
];

export function Hotels() {
  return (
    <section id="hotels" className="py-20 md:py-24" style={{ background: "#F4F7FC" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center mb-14">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-accent/15 text-primary text-xs font-bold tracking-wide">
            HÔTELS PARTENAIRES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Vos clients arrivent déjà <span className="text-accent">connectés.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Proposez la carte SIM N&apos;ma SIM au moment de la réservation : vos voyageurs la récupèrent à la borne
            dès leur arrivée en Guinée, sans file d&apos;attente.
          </p>
        </Reveal>

        {/* Informations (gauche) + carrousel (droite) */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <Reveal x={-36} className="rounded-3xl p-7 sm:p-9 bg-primary text-white flex flex-col justify-center">
            <h3 className="text-xl font-extrabold mb-6">Pour les hôtels <span className="text-accent">partenaires</span></h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {AVANTAGES_HOTEL.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-white/75 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <a href="#contact" className="mt-8 self-start inline-flex items-center gap-2 bg-accent text-primary font-bold px-5 py-3 rounded-full hover:opacity-90 transition-opacity">
              Devenir hôtel partenaire <ArrowRight size={18} />
            </a>
          </Reveal>

          <Reveal x={36} className="h-full">
            <CarrouselImages images={IMAGES_HOTEL} className="h-full min-h-[340px]" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
