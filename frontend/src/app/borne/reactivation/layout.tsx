"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Stepper, Step } from "@/components/ui/Stepper";

const steps: Step[] = [
  { id: 1, label: "Identification" },
  { id: 2, label: "Format" },
  { id: 3, label: "Pièce d'identité" },
  { id: 4, label: "Selfie" },
  { id: 5, label: "Vérification" },
  { id: 6, label: "Paiement" },
  { id: 7, label: "Confirmation" },
];

export default function ReactivationLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  let currentStep = 1;
  if (pathname.includes("/format") || pathname.includes("esim/compatibilite")) currentStep = 2;
  else if (pathname.includes("piece-identite")) currentStep = 3;
  else if (pathname.includes("selfie")) currentStep = 4;
  else if (pathname.includes("verification")) currentStep = 5;
  else if (pathname.includes("paiement")) currentStep = 6;
  else if (pathname.includes("recu") || pathname.includes("esim/qr-code")) currentStep = 7;

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
