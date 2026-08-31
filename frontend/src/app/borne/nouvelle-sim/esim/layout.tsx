"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Stepper, Step } from "@/components/ui/Stepper";

const steps: Step[] = [
  { id: 1, label: "Forfait" },
  { id: 2, label: "Compatibilité" },
  { id: 3, label: "Pièce d'identité" },
  { id: 4, label: "Informations" },
  { id: 5, label: "Selfie" },
  { id: 6, label: "Récapitulatif" },
  { id: 7, label: "Paiement" },
  { id: 8, label: "eSIM" },
];

export default function EsimLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  let currentStep = 1;
  if (pathname.includes("compatibilite")) currentStep = 2;
  else if (pathname.includes("scan-piece")) currentStep = 3;
  else if (pathname.includes("confirmation-infos")) currentStep = 4;
  else if (pathname.includes("selfie")) currentStep = 5;
  else if (pathname.includes("recapitulatif")) currentStep = 6;
  else if (pathname.includes("paiement")) currentStep = 7;
  else if (pathname.includes("generation") || pathname.includes("qr-code")) currentStep = 8;

  return (
    <div className="w-full flex flex-col items-center w-full animate-in fade-in duration-500">
      <div className="w-full max-w-4xl mb-6 mt-2">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}
