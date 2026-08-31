"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, User, Smartphone, CreditCard, ShieldCheck } from "lucide-react";
import type { EsimForfait } from "@/data/esim-forfaits";

export default function EsimRecapitulatif() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [clientInfo, setClientInfo] = useState<any>({});
  const [forfait, setForfait] = useState<EsimForfait | null>(null);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    
    // Charger infos client
    try {
      const savedInfo = sessionStorage.getItem("kiosk_client_info");
      if (savedInfo) setClientInfo(JSON.parse(savedInfo));
    } catch (e) {}

    // Charger forfait
    try {
      const savedForfait = sessionStorage.getItem("kiosk_esim_forfait");
      if (savedForfait) setForfait(JSON.parse(savedForfait));
    } catch (e) {}

    // Guard
    if (!sessionStorage.getItem("kiosk_selfie_ok")) {
      router.replace("/borne/nouvelle-sim/esim/selfie");
    }
  }, [router]);

  const handleContinue = () => {
    sessionStorage.setItem("kiosk_esim_recap_ok", "true");
    router.push("/borne/nouvelle-sim/esim/paiement");
  };

  const t = {
    title: lang === "en" ? "Step 6/8 — Order Summary" : "Étape 6/8 — Récapitulatif de la commande",
    subtitle: lang === "en" ? "Please review your information before payment." : "Veuillez vérifier vos informations avant le paiement.",
    personalInfo: lang === "en" ? "Personal Information" : "Informations Personnelles",
    planInfo: lang === "en" ? "eSIM Plan" : "Forfait eSIM",
    price: lang === "en" ? "Total to pay" : "Total à payer",
    name: lang === "en" ? "Name" : "Nom",
    idNumber: lang === "en" ? "ID Number" : "Numéro de pièce",
    back: lang === "en" ? "Back" : "Retour",
    continue: lang === "en" ? "Proceed to payment" : "Passer au paiement",
  };

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-center">{t.title}</CardTitle>
        <p className="text-text-muted mt-2 text-center">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Infos Client */}
          <div className="border border-border-light rounded-xl p-5 bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-primary">{t.personalInfo}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-border-light pb-2">
                <span className="text-text-muted">{t.name}</span>
                <span className="font-bold text-text-main">{clientInfo.prenom} {clientInfo.nom}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2">
                <span className="text-text-muted">{t.idNumber}</span>
                <span className="font-bold text-text-main">{clientInfo.numeroPiece}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2">
                <span className="text-text-muted">Type de pièce</span>
                <span className="font-bold text-text-main uppercase">{clientInfo.typePiece}</span>
              </div>
            </div>
          </div>

          {/* Forfait eSIM */}
          <div className="border border-border-light rounded-xl p-5 bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-primary">{t.planInfo}</h3>
            </div>
            
            {forfait ? (
              <div className="space-y-3">
                <div className="flex justify-between border-b border-border-light pb-2">
                  <span className="text-text-muted">Offre</span>
                  <span className="font-bold text-text-main">{forfait.nom}</span>
                </div>
                <div className="flex justify-between border-b border-border-light pb-2">
                  <span className="text-text-muted">Données</span>
                  <span className="font-bold text-text-main">{forfait.data}</span>
                </div>
                <div className="flex justify-between border-b border-border-light pb-2">
                  <span className="text-text-muted">Validité</span>
                  <span className="font-bold text-text-main">{forfait.duree}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Aucun forfait sélectionné</p>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">{t.price}</p>
              <p className="text-3xl font-extrabold text-primary">
                {forfait ? forfait.prixGNF.toLocaleString("fr-FR") : "0"} GNF
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-4 py-2 rounded-lg font-medium">
              <ShieldCheck className="w-5 h-5" /> {lang === "en" ? "Identity verified" : "Identité vérifiée"}
            </div>
            <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-4 py-2 rounded-lg font-medium">
              <Smartphone className="w-5 h-5" /> {lang === "en" ? "Phone compatible" : "Téléphone compatible"}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button onClick={handleContinue} className="px-8" disabled={!forfait}>
            {t.continue} <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
