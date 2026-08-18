"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import ScanPiece from "../../nouvelle-sim/scan-piece/page";

// On réutilise intelligemment la vue de scan de la Nouvelle SIM car c'est la même maquette
export default function ReactivationScan() {
  const router = useRouter();
  
  // Dans un vrai cas, on passerait peut-être des props pour adapter l'URL de retour/continuer, 
  // mais on duplique simplement la logique ici pour respecter le routage Reactivation.
  
  return (
    <div onClick={(e) => {
      // Interception des clics pour forcer le bon routing
      const target = e.target as HTMLElement;
      if (target.innerText && (target.innerText.includes("Extraire") || target.innerText.includes("Extract"))) {
        e.stopPropagation();
        router.push("/borne/reactivation/selfie");
      }
    }}>
       <ScanPiece />
    </div>
  );
}
