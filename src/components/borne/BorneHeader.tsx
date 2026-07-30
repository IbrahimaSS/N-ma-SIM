"use client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const BorneHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Cacher complètement sur la page d'accueil
  if (pathname === "/borne/accueil" || pathname === "/") {
    return null;
  }

  // Le bouton Retour est visible UNIQUEMENT sur la page services
  // Sur les autres pages intérieures, le bouton retour est déjà dans le contenu de la page
  const showRetour = pathname === "/borne/services";

  return (
    <header style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 50,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 32px",
    }}>
      {/* Logo réel */}
      <div style={{
        background: "white",
        borderRadius: "0 0 16px 16px",
        boxShadow: "0 4px 16px rgba(31,2,112,0.10)",
        overflow: "hidden",
        width: 190, 
        height: 70, // Hauteur encore un peu augmentée
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <img
          src="/logo-transparent.png"
          alt="N'ma SIM"
          style={{ width: "100%", transform: "scale(1.3)", display: "block" }}
        />
      </div>

      {/* Bouton Retour — uniquement sur la page Services */}
      {showRetour && (
        <Button
          variant="secondary"
          className="rounded-full shadow-sm font-semibold"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
      )}
    </header>
  );
};
