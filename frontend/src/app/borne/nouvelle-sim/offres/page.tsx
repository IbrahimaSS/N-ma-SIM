"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Microchip, Smartphone, Banknote, ChevronRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle, ShoppingCart } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const PRIX_NOUVELLE_SIM = 10000; // Prix fixe de la carte SIM

interface OffreDB {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  type: string;
  couleur: string | null;
  estActif: boolean;
}

export default function Offres() {
  const router = useRouter();
  const [offres, setOffres] = useState<OffreDB[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État spécifique pour le panneau Recharge
  const [rechargeMontant, setRechargeMontant] = useState<number | null>(null);
  const [customMontant, setCustomMontant] = useState<string>("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/offres`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then((data) => {
        const list: OffreDB[] = data.data || data || [];
        const filtered = list.filter(
          (o) => o.type !== "SIM" && o.type !== "SIM_STANDARD" && !o.nom.toLowerCase().includes("sim standard")
        );
        setOffres(filtered);
        setSelectedOffer("");
      })
      .catch((err) => {
        console.error("[OFFRES]", err);
        setError("Impossible de charger les offres. Vérifiez la connexion au serveur.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Écoute les commandes de l'Agent IA
  useEffect(() => {
    const handleAiFill = (e: Event) => {
      const { target, value } = (e as CustomEvent).detail;
      // Sélectionner une offre par son nom (ex: "recharge")
      if (target === "select-offre") {
        const found = offres.find(o => o.nom.toLowerCase().includes(value.toLowerCase()));
        if (found) setSelectedOffer(found.id);
      }
      // Appliquer un montant de recharge dans le panneau offres
      if (target === "select-offre-montant") {
        const montant = parseInt(value);
        if (!isNaN(montant) && montant >= 1000) {
          setRechargeMontant(montant);
          setCustomMontant("");
        }
      }
    };
    document.addEventListener("ai-fill", handleAiFill);
    return () => document.removeEventListener("ai-fill", handleAiFill);
  }, [offres]);

  const getIcon = (type: string) => {
    switch (type) {
      case "RECHARGE": return <Smartphone className="w-6 h-6 text-accent absolute bottom-0 right-[-10px] bg-white rounded-full p-0.5" />;
      case "FORFAIT_PASS": return <Microchip className="w-8 h-8 text-accent absolute bottom-[-5px] right-[-15px] bg-white rounded-full p-1" />;
      case "DEPOT": return <Banknote className="w-7 h-7 text-accent absolute bottom-[-5px] right-[-15px] bg-white rounded-full p-1" />;
      default: return null;
    }
  };

  const finalMontantRecharge = rechargeMontant ?? (customMontant ? parseInt(customMontant.replace(/\s/g, "")) : 0) ?? 0;
  
  const selectedOfferObj = offres.find((o) => o.id === selectedOffer);
  const isRecharge = selectedOfferObj?.type === "RECHARGE";
  const montantOffre = isRecharge ? finalMontantRecharge : 0;
  const totalAPayer = PRIX_NOUVELLE_SIM + montantOffre;

  const handleContinue = () => {
    sessionStorage.setItem("kiosk_offer", JSON.stringify({
      id: selectedOfferObj?.id || "aucune",
      titre: selectedOfferObj?.nom || "Aucune offre",
      description: selectedOfferObj?.description || "Achat de SIM seule",
      prixGNF: totalAPayer, // Le total calculé est transmis au paiement
      type: selectedOfferObj?.type || "AUCUNE",
      detailsRecharge: isRecharge ? montantOffre : 0,
      prixBaseSim: PRIX_NOUVELLE_SIM
    }));
    
    router.push("/borne/nouvelle-sim/paiement");
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

  const showRechargePanel = isRecharge;
  const presetAmounts = [3000, 5000, 10000];
  const isValidRecharge = finalMontantRecharge >= 1000 && !isNaN(finalMontantRecharge);

  // Le bouton Continuer est actif si:
  // - Soit aucune offre n'est sélectionnée (SIM seule)
  // - Soit Recharge est sélectionnée ET le montant est valide
  const canContinue = !selectedOffer || (showRechargePanel && isValidRecharge);

  return (
    <div className="flex flex-col w-full pb-8 max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary mb-1">Choisissez une offre (Facultatif)</h1>
        <p className="text-text-muted">Vous pouvez acheter la carte SIM seule ou y ajouter une recharge.</p>
      </div>

      {/* Récapitulatif dynamique */}
      <Card className="mb-6 bg-primary/5 border-primary/20 p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main">Récapitulatif de commande</p>
            <div className="text-xs text-text-muted mt-1 flex flex-col gap-1">
              <span>Nouvelle SIM : <strong className="text-primary">{PRIX_NOUVELLE_SIM.toLocaleString('fr-FR')} GNF</strong></span>
              <span>Offre ({isRecharge ? 'Recharge' : 'Aucune'}) : <strong className="text-primary">{montantOffre > 0 ? `+ ${montantOffre.toLocaleString('fr-FR')} GNF` : '0 GNF'}</strong></span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">Total à payer</p>
          <p className="text-2xl font-extrabold text-accent">{totalAPayer.toLocaleString('fr-FR')} GNF</p>
        </div>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Grille des offres */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300 ${showRechargePanel ? 'lg:w-2/3' : 'w-full'}`}>
          {offres.map((offer) => {
            const isSelected = selectedOffer === offer.id;
            const isDisabled = offer.type === "FORFAIT_PASS" || offer.type === "DEPOT";

            return (
              <Card
                key={offer.id}
                className={`relative overflow-hidden transition-all duration-300 p-5 flex flex-col items-center text-center
                  ${isDisabled ? 'opacity-60 cursor-not-allowed bg-gray-50 grayscale-[50%]' : 'cursor-pointer hover:border-primary/30'}
                  ${isSelected ? 'border-accent shadow-md border-2 bg-white' : 'border-border-light bg-white'}
                `}
                onClick={() => {
                  if (isDisabled) return;
                  if (isSelected) {
                    // Désélectionner (Continuer sans offre)
                    setSelectedOffer("");
                    setRechargeMontant(null);
                    setCustomMontant("");
                  } else {
                    setSelectedOffer(offer.id);
                    if (offer.type !== "RECHARGE") {
                      setRechargeMontant(null);
                      setCustomMontant("");
                    }
                  }
                }}
              >
                {isDisabled && (
                  <div className="absolute top-3 right-3 bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    Bientôt disponible
                  </div>
                )}

                <div className="relative mb-3 mt-4">
                  <Microchip className={`w-12 h-12 ${isDisabled ? 'text-gray-400' : 'text-accent'}`} strokeWidth={1} />
                  {!isDisabled && getIcon(offer.type)}
                </div>

                <h3 className={`text-lg font-bold mb-1 ${isDisabled ? 'text-gray-500' : 'text-primary'}`}>{offer.nom}</h3>
                <p className="text-sm text-text-muted mb-3 pb-3 border-b border-border-light w-full">{offer.description}</p>

                <div className="mt-auto pt-2 w-full">
                  {isDisabled ? (
                    <Button variant="outline" className="w-full rounded-xl" disabled>
                      Indisponible
                    </Button>
                  ) : isSelected ? (
                    <div className="w-full bg-accent text-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                      <CheckCircle2 className="w-5 h-5" /> Sélectionnée
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full rounded-xl">
                      <ChevronRight className="w-5 h-5 mr-1" /> Choisir
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Panneau latéral dynamique pour Recharge */}
        {showRechargePanel && (
          <Card className="w-full lg:w-1/3 p-6 flex flex-col border-accent/30 shadow-lg animate-in slide-in-from-right-8 duration-300">
            <h3 className="text-lg font-bold text-primary mb-4 border-b border-border-light pb-2">
              Montant de la recharge
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              {presetAmounts.map((m) => (
                <button
                  key={m}
                  onClick={() => { setRechargeMontant(m); setCustomMontant(""); }}
                  className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-colors ${
                    rechargeMontant === m
                      ? "border-accent bg-accent/10 text-primary"
                      : "border-border-light bg-white text-text-muted hover:border-accent/50"
                  }`}
                >
                  {m.toLocaleString("fr-FR")} GNF
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-text-main block mb-2">Autre montant (GNF)</label>
              <input
                type="number"
                value={customMontant}
                onChange={(e) => {
                  setCustomMontant(e.target.value);
                  setRechargeMontant(null);
                }}
                placeholder="Ex : 15000"
                className={`w-full p-3 rounded-xl border-2 outline-none text-lg transition-colors ${
                  customMontant ? "border-accent bg-accent/5 text-primary" : "border-border-light bg-white"
                }`}
              />
            </div>
            
            {/* Affichage de la validation en direct */}
            {!isValidRecharge && (finalMontantRecharge > 0 || customMontant.length > 0) && (
              <p className="text-xs text-danger mb-4 text-center font-medium">Le montant minimum est de 1 000 GNF</p>
            )}

            <div className="mt-auto pt-4 border-t border-border-light">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-text-muted font-medium">Nouveau Total :</span>
                <span className="text-xl font-bold text-primary">{totalAPayer.toLocaleString('fr-FR')} GNF</span>
              </div>
              <Button
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full py-6 text-lg font-bold"
              >
                Confirmer la recharge <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Actions (seulement si le panneau recharge n'est pas affiché, ou pour retour) */}
      <div className="flex justify-between items-center w-full pt-4">
        <Button variant="secondary" className="bg-white" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
        {!showRechargePanel && (
          <Button
            data-ai-action="btn-continuer-offres"
            onClick={handleContinue}
            disabled={!canContinue}
            size="lg"
            variant={selectedOffer ? "primary" : "outline"}
            className={`px-8 shadow-md ${!selectedOffer ? 'border-primary text-primary hover:bg-primary/5' : ''}`}
          >
            {selectedOffer ? 'Continuer avec cette offre' : 'Continuer sans offre'} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
