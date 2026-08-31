"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, Wifi, Smartphone, CheckCircle2 } from "lucide-react";
import { getKycResult } from "@/lib/kyc.storage";

export default function EsimGeneration() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [status, setStatus] = useState<"initializing" | "generating" | "finalizing" | "success" | "error">("initializing");

  // Garde contre la double exécution en Strict Mode
  const isGenerating = useRef(false);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");

    // Garde de route
    if (!sessionStorage.getItem("kiosk_payment")) {
      router.replace("/borne/nouvelle-sim/esim/paiement");
      return;
    }

    if (isGenerating.current) return;
    isGenerating.current = true;

    const run = async () => {
      setStatus("generating");

      try {
        const forfait = JSON.parse(sessionStorage.getItem("kiosk_esim_forfait") || "{}");
        const clientInfo = JSON.parse(sessionStorage.getItem("kiosk_client_info") || "{}");
        const payment = JSON.parse(sessionStorage.getItem("kiosk_payment") || "{}");
        const kyc = await getKycResult();
        const champs = kyc?.champs || {};
        const nomClient =
          `${clientInfo.prenom || champs.prenom || ""} ${clientInfo.nom || champs.nom || ""}`.trim() || "Client";

        // 1. Enregistrer la demande dans le back-office (Client + DemandeSIM + Paiement, statut VALIDEE)
        let numeroDossier: string | undefined;
        let demandeId: string | undefined;
        try {
          const res = await fetch("/api/soumettre-demande", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_info: {
                nom: clientInfo.nom || champs.nom || "Inconnu",
                prenom: clientInfo.prenom || champs.prenom || "Inconnu",
                date_naissance: clientInfo.dateNaissance || champs.date_naissance || undefined,
                lieu_naissance: clientInfo.adresse || champs.lieu_naissance || undefined,
                nationalite: champs.nationalite || "Guinéenne",
                type_piece: clientInfo.typePiece || kyc?.type_piece || champs.type_piece || undefined,
                numero_piece:
                  clientInfo.numeroPiece || champs.numero_identite || champs.numero_carte || champs.nin || undefined,
                telephone: clientInfo.telephone || undefined,
              },
              // Offre eSIM liée uniquement si elle vient du back-office (id cuid) ; les forfaits
              // de secours locaux (id "esim-…") ne sont pas en base → pas d'offre_id
              offre_id:
                typeof forfait.id === "string" && !forfait.id.startsWith("esim-")
                  ? forfait.id
                  : undefined,
              format_sim: "ESIM",
              paiement: {
                montant: forfait.prixGNF || 0,
                methode: payment.method === "Orange Money" ? "ORANGE_MONEY" : "LENGO_PAY",
                reference: payment.reference || undefined,
              },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            numeroDossier = data.numeroDossier;
            demandeId = data.demandeId;
          } else {
            console.error("[ESIM] Soumission demande échouée", await res.text());
          }
        } catch (e) {
          // On ne bloque pas la délivrance de l'eSIM si le back-office est indisponible
          console.error("[ESIM] Soumission demande erreur", e);
        }

        setStatus("finalizing");

        // 2. Générer le profil eSIM (simulation infrastructure RSP / SM-DP+ opérateur)
        const response = await fetch("/api/esim/generer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forfaitId: forfait.id, numeroDossier, nomClient }),
        });
        if (!response.ok) throw new Error("Erreur génération eSIM");
        const profile = await response.json();

        // 3. Sauvegarde du profil pour l'écran QR Code
        sessionStorage.setItem("kiosk_esim_profile", JSON.stringify({ ...profile, demandeId }));
        setStatus("success");

        // 4. Redirection automatique
        setTimeout(() => {
          router.push("/borne/nouvelle-sim/esim/qr-code");
        }, 1400);
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };

    run();
  }, [router]);

  const t = {
    title: lang === "en" ? "Generating your eSIM profile..." : "Génération de votre profil eSIM...",
    subtitle: lang === "en" ? "Please wait, do not remove your documents." : "Veuillez patienter, ne retirez pas vos documents.",
    initializing: lang === "en" ? "Connecting to operator server..." : "Connexion au serveur de l'opérateur...",
    generating: lang === "en" ? "Registering your request..." : "Enregistrement de votre demande...",
    finalizing: lang === "en" ? "Creating the digital profile..." : "Création du profil numérique...",
    success: lang === "en" ? "Profile generated successfully!" : "Profil généré avec succès !",
    error: lang === "en" ? "An error occurred." : "Une erreur est survenue.",
  };

  const getStatusText = () => {
    switch (status) {
      case "initializing": return t.initializing;
      case "generating": return t.generating;
      case "finalizing": return t.finalizing;
      case "success": return t.success;
      case "error": return t.error;
      default: return "";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-none bg-transparent">
      <CardContent className="flex flex-col items-center justify-center py-20">

        <div className="relative mb-12">
          {/* Cercle pulsant externe */}
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>

          {/* Centre */}
          <div className="relative w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-primary/10 z-10">
            {status === "success" ? (
              <CheckCircle2 className="w-16 h-16 text-success animate-in zoom-in duration-300" />
            ) : (
              <Wifi className="w-14 h-14 text-primary animate-pulse" />
            )}

            {/* Petit badge téléphone */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-primary mb-3 text-center">
          {status === "success" ? t.success : t.title}
        </h2>

        <div className="flex items-center gap-3 text-text-muted">
          {status !== "success" && status !== "error" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          <span className="font-medium text-lg">{getStatusText()}</span>
        </div>

        {status === "error" && (
          <Button onClick={() => window.location.reload()} className="mt-8">
            {lang === "en" ? "Retry" : "Réessayer"}
          </Button>
        )}

      </CardContent>
    </Card>
  );
}
