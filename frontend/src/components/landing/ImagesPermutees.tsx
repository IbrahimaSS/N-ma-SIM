"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ImagesPermuteesProps {
  images: [{ src: string; alt: string }, { src: string; alt: string }];
  /** Délai entre deux échanges de place (ms). */
  intervalle?: number;
  className?: string;
}

// Les deux emplacements : gauche (en haut) et droite (décalé vers le bas)
const EMPLACEMENTS = [
  { left: "0%", top: "0px" },
  { left: "calc(50% + 8px)", top: "40px" },
];

/**
 * Deux photos côte à côte qui échangent leur place en glissant (la 1re va à la place de la 2e
 * et inversement). Désactivé si l'utilisateur a demandé moins d'animations.
 */
export function ImagesPermutees({ images, intervalle = 1000, className = "" }: ImagesPermuteesProps) {
  const [inverse, setInverse] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setInverse((v) => !v), intervalle);
    return () => clearInterval(id);
  }, [intervalle]);

  return (
    <div className={`relative ${className}`}>
      {images.map((img, i) => {
        const place = EMPLACEMENTS[inverse ? 1 - i : i];
        return (
          <div
            key={img.src}
            className="absolute rounded-3xl overflow-hidden shadow-lg"
            style={{
              left: place.left,
              top: place.top,
              width: "calc(50% - 8px)",
              height: "calc(100% - 40px)",
              transition: "left 0.8s cubic-bezier(0.65, 0, 0.35, 1), top 0.8s cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          >
            <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
          </div>
        );
      })}
    </div>
  );
}
