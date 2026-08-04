"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Microchip, Globe, GraduationCap, ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MOCK_OFFERS } from "@/data/mock-data";

export default function Offres() {
  const router = useRouter();
  const [selectedOffer, setSelectedOffer] = useState<string>("off-1"); // SIM Standard par défaut

  const getIcon = (type: string) => {
    switch (type) {
      case "INTERNET": return <Globe className="w-6 h-6 text-accent absolute bottom-0 right-[-10px] bg-white rounded-full p-0.5" />;
      case "ETUDIANT": return <GraduationCap className="w-8 h-8 text-accent absolute bottom-[-5px] right-[-15px] bg-white rounded-full p-1" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col w-full pb-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Choisissez votre offre</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {MOCK_OFFERS.map((offer) => {
          const isSelected = selectedOffer === offer.id;
          return (
            <Card 
              key={offer.id}
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 p-5 flex flex-col items-center text-center ${isSelected ? 'border-accent shadow-md border-2' : 'hover:border-primary/30 border-border-light'}`}
              onClick={() => setSelectedOffer(offer.id)}
            >
              <div className="relative mb-3">
                <Microchip className="w-12 h-12 text-accent" strokeWidth={1} />
                {getIcon(offer.type)}
              </div>
              
              <h3 className="text-lg font-bold text-primary mb-1">{offer.titre}</h3>
              <p className="text-sm text-text-muted mb-4 pb-4 border-b border-border-light w-full">{offer.description}</p>
              
              <div className="mb-4">
                <span className="text-2xl font-extrabold text-primary">{offer.prixGNF.toLocaleString('fr-FR')}</span>
                <span className="text-text-muted font-medium ml-1">GNF</span>
              </div>
              
              {isSelected ? (
                <div className="w-full bg-accent text-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <CheckCircle2 className="w-5 h-5" /> Sélectionnée
                </div>
              ) : (
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setSelectedOffer(offer.id)}>
                  <ChevronRight className="w-5 h-5 mr-1" /> Choisir
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center w-full">
        <Button variant="secondary" className="bg-white" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
        <Button onClick={() => router.push("/borne/nouvelle-sim/paiement")} size="lg" className="px-8 shadow-md">
          Continuer vers paiement <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
