"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck, Lock, Receipt, RefreshCcw, ArrowLeft, ChevronRight,
  AlertCircle, Phone, CreditCard, Loader2
} from "lucide-react";

// Prix par défaut si le backend ne répond pas
const PRIX_DEFAUT = 10000;

export default function PaiementReactivation() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Données dynamiques
  const [prix, setPrix] = useState<number>(PRIX_DEFAUT);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [numero, setNumero] = useState("—");
  const [motif, setMotif] = useState("—");

  // Écouter le message de succès de l'Iframe Lengo Pay
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "LENGO_PAY_SUCCESS") {
        await validerPaiementReactivation({
          method: "Lengo Pay",
          reference: event.data?.pay_id || "NMA-PAY-LENG-01"
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [prix]); // Dépendance sur 'prix' pour valider avec le bon montant

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    setNumero(sessionStorage.getItem("reactivation_numero") || "—");

    const motifKey = sessionStorage.getItem("reactivation_motif") || "";
    const motifLabels: Record<string, string> = {
      perte: "Perte de la carte SIM",
      inactivite: "Longue période d'inactivité",
      desactivee: "Puce désactivée",
    };
    setMotif(motifLabels[motifKey] || motifKey || "—");

    // Charger le prix depuis l'offre SIM Standard configurée par l'admin
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    fetch(`${BACKEND_URL}/api/offres?type=SIM_STANDARD`)
      .then((r) => r.json())
      .then((data) => {
        const offres = data?.data ?? data ?? [];
        const simStandard = Array.isArray(offres) ? offres[0] : null;
        if (simStandard?.prix) {
          setPrix(Number(simStandard.prix));
        } else {
          setPrix(PRIX_DEFAUT);
        }
      })
      .catch(() => setPrix(PRIX_DEFAUT))
      .finally(() => setIsLoadingPrice(false));
  }, []);

  const validerPaiementReactivation = async (paymentInfo: { method: string; reference: string }) => {
    setIsLoading(true);
    setError("");
    try {
      const kycInfo = JSON.parse(sessionStorage.getItem("kiosk_client_info") || "{}");
      const kycChampsRaw = sessionStorage.getItem("kyc_champs");
      const kycChamps = kycChampsRaw ? JSON.parse(kycChampsRaw) : {};
      const docType = sessionStorage.getItem("kiosk_doc_type") || "";
      const numeroAReactiver = sessionStorage.getItem("reactivation_numero") || "";
      const motifReactivation = sessionStorage.getItem("reactivation_motif") || "";

      const res = await fetch("/api/soumettre-reactivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_info: {
            ...kycChamps,
            ...kycInfo,
            // Type de pièce : priorité au choix manuel de l'utilisateur
            typePiece: kycInfo.typePiece || kycChamps.type_piece || kycChamps.typePiece || docType || undefined,
          },
          numero_a_reactiver: numeroAReactiver,
          motif_reactivation: motifReactivation,
          paiement: {
            montant: prix,
            methode: paymentInfo.method,
            reference: paymentInfo.reference,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur serveur");

      sessionStorage.setItem("ticket_ref", data.numeroDossier);
      sessionStorage.setItem("demande_id", data.demandeId);
      sessionStorage.setItem("reactivation_montant_paye", prix.toString());
      
      // Nettoyage
      sessionStorage.removeItem("kiosk_client_info");
      sessionStorage.removeItem("kyc_champs");
      
      router.push("/borne/reactivation/recu");
    } catch (err: unknown) {
      console.error("[REACTIVATION]", err);
      setError(lang === "en"
        ? "An error occurred during validation. Please try again."
        : "Une erreur est survenue lors de la validation. Veuillez réessayer.");
      setPaymentUrl(null); // Permet de réessayer
    } finally {
      setIsLoading(false);
    }
  };

  const initLengoPay = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: prix, currency: "GNF" })
      });
      const data = await res.json();
      if (data.payment_url) {
        setPaymentUrl(data.payment_url);
      } else {
        setError(lang === "en" ? "Error initializing payment." : "Erreur lors de l'initialisation du paiement.");
      }
    } catch (err) {
      console.error(err);
      setError(lang === "en" ? "Network error" : "Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  const prixFormate = isLoadingPrice
    ? "..."
    : prix.toLocaleString("fr-FR") + " GNF";

  const t = {
    summary: lang === "en" ? "Summary" : "Récapitulatif",
    service: lang === "en" ? "Service" : "Service",
    serviceVal: lang === "en" ? "SIM Reactivation" : "Réactivation puce",
    number: lang === "en" ? "Number" : "Numéro",
    reason: lang === "en" ? "Reason" : "Motif",
    amount: lang === "en" ? "Amount" : "Montant",
    total: lang === "en" ? "Total to pay" : "Total à payer",
    secure: lang === "en" ? "100% secure transactions." : "Transactions 100% sécurisées.",
    encrypted: lang === "en" ? "Encrypted and confidential data." : "Données chiffrées et confidentielles.",
    totalDue: lang === "en" ? "Total due" : "Total à régler",
    back: lang === "en" ? "Back" : "Retour",
  };

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* ── Récapitulatif ── */}
        <Card className="p-4">
          <h3 className="font-bold text-primary mb-4 text-base">{t.summary}</h3>

          {/* Service */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light">
              <RefreshCcw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">{t.service}</p>
              <p className="font-bold text-primary">{t.serviceVal}</p>
            </div>
          </div>

          {/* Numéro */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">{t.number}</p>
              <p className="font-bold text-primary">{numero}</p>
            </div>
          </div>

          {/* Motif */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">{t.reason}</p>
              <p className="font-bold text-primary text-sm">{motif}</p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">{t.total}</div>
            <div className={`font-bold text-primary text-lg ${isLoadingPrice ? "animate-pulse" : ""}`}>
              {prixFormate}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-border-light">
            <div className="flex items-center gap-3 text-sm text-text-main"><ShieldCheck className="w-5 h-5 text-accent" /> {t.secure}</div>
            <div className="flex items-center gap-3 text-sm text-text-main"><Lock className="w-5 h-5 text-primary" /> {t.encrypted}</div>
          </div>
        </Card>

        {/* ── Espace de paiement Lengo Pay ── */}
        <Card className="p-0 lg:col-span-2 overflow-hidden flex flex-col items-center justify-center min-h-[400px] border-2 border-primary/10 relative">
          {paymentUrl ? (
            <>
              <iframe 
                src={paymentUrl} 
                className="w-full h-full min-h-[500px] border-0" 
                allow="payment"
                title="Lengo Pay"
              />
              <div className="absolute top-2 right-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => validerPaiementReactivation({ method: "Lengo Pay (Mode Démo)", reference: "NMA-DEMO-2026" })}
                  className="text-xs bg-white text-gray-500 hover:text-primary shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bypass (Mode Démo)"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Paiement Sécurisé</h3>
              <p className="text-text-muted mb-8 max-w-md">
                Vous allez être redirigé vers la passerelle sécurisée Lengo Pay pour finaliser votre paiement avec Orange Money, Mobile Money ou Carte Bancaire.
              </p>
              <Button 
                data-ai-action="btn-confirmer-paiement"
                size="lg" 
                className="px-10 py-6 text-lg w-full max-w-sm shadow-md"
                onClick={initLengoPay}
                disabled={isLoading || isLoadingPrice}
              >
                {isLoading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <ShieldCheck className="w-6 h-6 mr-2" />}
                {isLoading ? "Initialisation..." : "Payer maintenant"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Barre de bas de page */}
      <div className="bg-white border border-border-light rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-3">
        <div>
          <p className="text-text-muted font-medium mb-1">{t.totalDue}</p>
          <p className={`text-3xl font-extrabold text-primary ${isLoadingPrice ? "animate-pulse" : ""}`}>{prixFormate}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" className="h-14 px-6" onClick={() => router.back()} disabled={isLoading}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
        </div>
      </div>
    </div>
  );
}
