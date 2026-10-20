import Image from "next/image";

// Photo réelle de la borne, détourée (fond transparent), posée sur une ombre au sol
export function BornePhoto({
  hauteur,
  alt = "La borne N'ma SIM",
  priority = false,
  imgClassName = "",
}: {
  hauteur: string;
  alt?: string;
  priority?: boolean;
  imgClassName?: string;
}) {
  return (
    <div className="relative inline-flex flex-col items-center" style={{ height: hauteur }}>
      <Image
        src="/borne-photo.png"
        alt={alt}
        width={349}
        height={913}
        sizes="(min-width: 1024px) 240px, 45vw"
        priority={priority}
        className={`relative z-10 h-full w-auto drop-shadow-[0_18px_28px_rgba(0,0,0,0.25)] ${imgClassName}`}
      />
      <div aria-hidden className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[130%] h-6 rounded-[50%] bg-black/30 blur-md" />
    </div>
  );
}
