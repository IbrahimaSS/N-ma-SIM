"use client";
import { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Décalage de départ en Y (px). */
  y?: number;
  /** Délai avant le début de l'animation (s). */
  delay?: number;
  /** Si défini, anime chaque enfant direct en cascade (grilles de cartes). */
  stagger?: number;
  /** Anime depuis la gauche/droite plutôt que le bas. */
  x?: number;
}

/** Fait apparaître son contenu (fade + translation) au moment où il entre dans le viewport. */
export function Reveal({ children, className, y = 36, delay = 0, stagger, x }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets: Element | Element[] = stagger ? Array.from(el.children) : el;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: x === undefined ? y : 0, x: x ?? 0 },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
          stagger: stagger || 0,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, y, x, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
