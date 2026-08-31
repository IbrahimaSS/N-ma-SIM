"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Stepper, Step } from "@/components/ui/Stepper";

const steps: Step[] = [
  { id: 1, label: "Pièce d'identité" },
  { id: 2, label: "Informations" },
  { id: 3, label: "Selfie" },
  { id: 4, label: "Offre" },
  { id: 5, label: "Paiement" },
  { id: 6, label: "Confirmation" },
];

export default function NouvelleSIMLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Déduire l'étape actuelle depuis l'URL
  let currentStep = 1;
  if (pathname.includes("confirmation-infos")) currentStep = 2;
  else if (pathname.includes("selfie")) currentStep = 3;
  else if (pathname.includes("offres")) currentStep = 4;
  else if (pathname.includes("paiement")) currentStep = 5;
  else if (pathname.includes("recu")) currentStep = 6;

  const isEsim = pathname.includes("/esim");
  const isFormat = pathname.includes("/format");
  const showStepper = !isEsim && !isFormat;

  return (
    <div className="w-full flex flex-col items-center w-full animate-in fade-in duration-500">
      {/* Le Stepper est affiché en haut de chaque page de ce parcours */}
      {showStepper && (
        <div className="w-full max-w-4xl mb-6 mt-2">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      )}
      
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}
