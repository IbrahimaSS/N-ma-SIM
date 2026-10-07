"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ArrowRight, PlayCircle } from "lucide-react";

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.fromTo(".hero-badge", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(".hero-line", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, "-=0.2")
        .fromTo(".hero-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45 }, "-=0.25")
        .fromTo(".hero-cta", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 }, "-=0.2")
        .fromTo(".hero-trust", { opacity: 0 }, { opacity: 1, duration: 0.45 }, "-=0.1")
        .fromTo(".hero-kiosk", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.5");

      gsap.to(".hero-kiosk-img", {
        scale: 1.06,
        duration: 2.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "center center",
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-navbar-invert="true"
      className="relative overflow-hidden flex items-center min-h-screen pt-20"
      style={{ background: "#2656A2" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, transparent 15%, #F5BB02 100%)", opacity: 0.8 }}
      />
      <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[55%_45%] gap-10 lg:gap-6 items-center py-10">
        <div className="text-center lg:text-left">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-white/75 tracking-wide">Borne interactive · Guinée Conakry</span>
          </div>

          <h1
            className="text-[42px] sm:text-[52px] lg:text-[68px] font-bold text-white leading-[1.08] tracking-tight mb-5 overflow-hidden"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <span className="hero-line block">Les services SIM,</span>
            <span className="hero-line block" style={{ color: "#F5BB02" }}>autrement.</span>
          </h1>

          <p className="hero-sub text-lg sm:text-xl text-white/60 font-medium mb-8 max-w-xl mx-auto lg:mx-0">
            Votre SIM, en toute simplicité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-9">
            <a
              href="#solution"
              className="hero-cta inline-flex items-center gap-2 justify-center rounded-xl bg-accent text-primary font-semibold text-sm h-12 px-6 hover:brightness-95 transition-[filter] w-full sm:w-auto"
            >
              Découvrir la solution <ArrowRight size={16} />
            </a>
            <Link
              href="/borne/accueil"
              className="hero-cta inline-flex items-center gap-2 justify-center rounded-xl bg-transparent border border-white/30 text-white font-semibold text-sm h-12 px-6 hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              <PlayCircle size={18} /> Voir la démonstration
            </Link>
          </div>

          <div className="hero-trust flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2">
            {["Nouvelle SIM", "Réactivation", "Recharge", "Vérification"].map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:inline text-white/20">•</span>}
                <span className="text-xs sm:text-sm font-semibold text-white/50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-kiosk flex justify-center">
          <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/10 bg-white" style={{ width: "min(74vw, 320px)" }}>
            <Image
              src="/borne-maquette.png"
              alt="Maquette de la borne N'ma SIM"
              width={640}
              height={1068}
              className="hero-kiosk-img w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
