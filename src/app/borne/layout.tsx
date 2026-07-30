import { ReactNode } from "react";
import { BorneHeader } from "@/components/borne/BorneHeader";

export default function BorneLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-screen font-sans"
      style={{ backgroundColor: "#ECEDF5" }}
    >

      {/* ================================================================
          FOND DÉCORATIF — position FIXED → toujours visible même en scrollant
      ================================================================ */}
      <svg
        style={{
          position: "fixed", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none", zIndex: 0,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Masses blanches de profondeur */}
        <ellipse cx="5" cy="48" rx="36" ry="46" fill="white" opacity="0.32" />
        <ellipse cx="96" cy="58" rx="34" ry="42" fill="white" opacity="0.20" />

        {/* JAUNE — coin haut droit */}
        <path d="M 100,0 L 60,0 A 48,48 0 0,1 100,55 Z" fill="#FFBA08" />
        <path d="M 60,0 A 60,60 0 0,1 100,72" stroke="#FFBA08" strokeWidth="0.18" fill="none" opacity="0.9" />

        {/* BLEU — coin bas gauche */}
        <path d="M 0,100 L 0,40 A 58,58 0 0,0 42,100 Z" fill="#1F0270" />
      </svg>

      {/* Motif pois — aussi fixé */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 0,
          width: "clamp(180px, 22vw, 380px)",
          height: "clamp(180px, 22vw, 380px)",
          backgroundImage: "radial-gradient(circle, #A8A8C8 1.8px, transparent 1.8px)",
          backgroundSize: "clamp(16px, 1.8vw, 24px) clamp(16px, 1.8vw, 24px)",
          opacity: 0.32,
          maskImage: "radial-gradient(ellipse at top left, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top left, black 20%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header — fixé en haut, passe par-dessus le fond */}
      <BorneHeader />

      {/* Contenu principal — scrollable librement */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(16px, 4vh, 40px) clamp(60px, 8vw, 160px)",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>

    </div>
  );
}
