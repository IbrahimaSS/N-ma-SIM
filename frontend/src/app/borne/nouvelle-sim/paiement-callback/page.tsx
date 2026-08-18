"use client";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PaiementCallback() {
  useEffect(() => {
    // Cette page est chargée à l'intérieur de l'Iframe après le succès du paiement Lengo Pay.
    // Nous envoyons un message au parent (la borne) pour lui dire que c'est terminé.
    if (window.parent) {
      window.parent.postMessage({ type: "LENGO_PAY_SUCCESS" }, "*");
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-success p-6 text-center animate-in fade-in zoom-in duration-500">
      <CheckCircle2 className="w-20 h-20 mb-4 drop-shadow-md" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Paiement Réussi !</h1>
      <p className="text-gray-500">Redirection en cours...</p>
    </div>
  );
}
