"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface CarrouselImagesProps {
  images: { src: string; alt: string }[];
  /** Délai entre deux images (ms). */
  intervalle?: number;
  className?: string;
}

/** Carrousel en fondu, défilement automatique + points de navigation. */
export function CarrouselImages({ images, intervalle = 4000, className = "" }: CarrouselImagesProps) {
  const [actif, setActif] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setActif((i) => (i + 1) % images.length), intervalle);
    return () => clearInterval(id);
  }, [images.length, intervalle, actif]); // actif : un clic sur un point relance le délai

  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      {images.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`object-cover transition-opacity duration-1000 ${i === actif ? "opacity-100" : "opacity-0"}`}
          priority={i === 0}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
        {images.map((img, i) => (
          <button
            key={img.src}
            onClick={() => setActif(i)}
            aria-label={`Image ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === actif ? "w-6 bg-accent" : "w-2 bg-white/70"}`}
          />
        ))}
      </div>
    </div>
  );
}
