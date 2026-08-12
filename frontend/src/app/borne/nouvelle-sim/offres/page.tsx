"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Microchip, Globe, GraduationCap, Building2, ChevronRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Type aligné sur le schéma Prisma du backend
interface OffreDB {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  type: "SIM_STANDARD" | "SIM_INTERNET" | "SIM_ETUDIANT" | "SIM_ENTREPRISE";
  duree: string | null;
  data: string | null;
  appels: string | null;
  sms: string | null;
  couleur: string | null;
  estActif: boolean;
}

export default function Offres() {
  const router = useRouter();
  const [offres, setOffres] = useState<OffreDB[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les offres depuis le vrai backend
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/offres`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((data) => {
        const list: OffreDB[] = data.data || data || [];
        setOffres(list);
        if (list.length > 0) setSelectedOffer(list[0].id);
      })
      .catch((err) => {
        console.error("[OFFRES]", err);
        setError("Impossible de charger les offres. Vérifiez la connexion au serveur.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "SIM_INTERNET": return <Globe className="w-6 h-6 text-accent absolute bottom-0 right-[-10px] bg-white rounded-full p-0.5" />;
      case "SIM_ETUDIANT": return <GraduationCap className="w-8 h-8 text-accent absolute bottom-[-5px] right-[-15px] bg-white rounded-full p-1" />;
      case "SIM_ENTREPRISE": return <Building2 className="w-7 h-7 text-accent absolute bottom-[-5px] right-[-15px] bg-white rounded-full p-1" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <p className="text-text-muted font-medium">Chargement des offres...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-danger" />
        <p className="text-danger font-bold">{error}</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  const selectedOfferObj = offres.find((o) => o.id === selectedOffer);

  return (
    <div className="flex flex-col w-full pb-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Choisissez votre offre</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {offres.map((offer) => {
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

              <h3 className="text-lg font-bold text-primary mb-1">{offer.nom}</h3>
              <p className="text-sm text-text-muted mb-3 pb-3 border-b border-border-light w-full">{offer.description}</p>

              {/* Détails forfait */}
              {(offer.data || offer.appels || offer.sms) && (
                <div className="w-full text-xs text-text-muted space-y-1 mb-3">
                  {offer.data && <div className="flex justify-between"><span>Data</span><span className="font-semibold text-primary">{offer.data}</span></div>}
                  {offer.appels && <div className="flex justify-between"><span>Appels</span><span className="font-semibold text-primary">{offer.appels}</span></div>}
                  {offer.sms && <div className="flex justify-between"><span>SMS</span><span className="font-semibold text-primary">{offer.sms}</span></div>}
                </div>
              )}

              <div className="mb-4">
                <span className="text-2xl font-extrabold text-primary">{offer.prix.toLocaleString('fr-FR')}</span>
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
        <Button
          onClick={() => {
            if (selectedOfferObj) {
              // On sauvegarde l'objet de l'offre DB pour récupérer le vrai ID
              sessionStorage.setItem("kiosk_offer", JSON.stringify({
                id: selectedOfferObj.id,
                titre: selectedOfferObj.nom,
                description: selectedOfferObj.description,
                prixGNF: selectedOfferObj.prix,
                type: selectedOfferObj.type,
              }));
            }
            router.push("/borne/nouvelle-sim/paiement");
          }}
          disabled={!selectedOffer}
          size="lg"
          className="px-8 shadow-md"
        >
          Continuer vers paiement <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
