"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Phone, Banknote, AlertCircle, ShieldCheck } from "lucide-react";

export default function RechargePaiement() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [numero, setNumero] = useState("—");
  const [montant, setMontant] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [numeroDossier, setNumeroDossier] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    setNumero(sessionStorage.getItem("recharge_numero") || "—");
    setMontant(parseInt(sessionStorage.getItem("recharge_montant") || "0"));
  }, []);

  const initLengoPay = async () => {
    if (montant <= 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: montant, currency: "GNF" })
      });
      const data = await res.json();
      if (data.payment_url) {
        setPaymentUrl(data.payment_url);
      } else {
        setError("Erreur lors de l'initialisation du paiement.");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  const executeRecharge = async (payMethod: string, payRef: string) => {
    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/soumettre-recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero,
          montant,
          methode: payMethod,
          reference: payRef
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur serveur");
      }

      setNumeroDossier(data.numeroDossier || "NMA-RC-0000");
      setIsDone(true);

      // Nettoyage sessionStorage
      sessionStorage.removeItem("recharge_numero");
      sessionStorage.removeItem("recharge_montant");

    } catch (err: any) {
      console.error("[RECHARGE]", err);
      setError(lang === "en" ? "An error occurred. Please try again." : "Une erreur est survenue. Veuillez réessayer.");
      setPaymentUrl(null); // Reset pour pouvoir réessayer
    } finally {
      setIsProcessing(false);
    }
  };

  // Écouter le message de succès de l'Iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "LENGO_PAY_SUCCESS") {
        executeRecharge("Lengo Pay", event.data?.pay_id || "NMA-PAY-LENG-01");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [numero, montant]); // Les dépendances pour s'assurer qu'executeRecharge a le bon état

  const t = {
    title: lang === "en" ? "Step 3/3 — Payment" : "Étape 3/3 — Paiement",
    subtitle: lang === "en" ? "Confirm your top-up." : "Confirmez votre rechargement.",
    number: lang === "en" ? "Number to top up" : "Numéro à recharger",
    amount: lang === "en" ? "Amount" : "Montant",
    back: lang === "en" ? "Back" : "Retour",
    processing: lang === "en" ? "Processing..." : "Traitement en cours...",
    success: lang === "en" ? "Recharge successful!" : "Recharge effectuée !",
    successMsg: lang === "en" ? "Your number has been topped up." : "Votre numéro a bien été rechargé.",
    home: lang === "en" ? "Back to home" : "Retour à l'accueil",
  };

  if (isDone) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-4">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">{t.success}</h2>
            <p className="text-text-muted">{t.successMsg}</p>
            <p className="text-lg font-bold text-primary mt-2">
              +224 {numero} · {montant.toLocaleString("fr-FR")} GNF
            </p>
          </div>

          {/* Numéro de dossier */}
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16, padding: "16px 32px", textAlign: "center", width: "100%", maxWidth: 360 }}>
            <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 4 }}>{lang === "en" ? "Transaction reference" : "Référence de la transaction"}</p>
            <p style={{ color: "#1F0270", fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>{numeroDossier}</p>
          </div>

          <Button size="lg" onClick={() => router.push("/borne/accueil")}>
            {t.home}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-4">
      <CardHeader>
        <CardTitle className="text-2xl">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <h2 className="text-xl font-bold text-primary">{t.processing}</h2>
            <p className="text-text-muted">{lang === "en" ? "Please wait..." : "Veuillez patienter..."}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            
            <div className="flex items-center gap-4 w-full">
               {/* Récapitulatif à gauche */}
               <div style={{ background: "#F9FAFB", borderRadius: 16, padding: "20px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Phone size={16} style={{ color: "#6B7280" }} />
                      <span style={{ color: "#6B7280", fontSize: 13 }}>{t.number}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: "#1F0270", fontSize: 14 }}>+224 {numero}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E5E7EB", paddingTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Banknote size={16} style={{ color: "#6B7280" }} />
                      <span style={{ color: "#6B7280", fontSize: 13 }}>{t.amount}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: "#1F0270", fontSize: 18 }}>{montant.toLocaleString("fr-FR")} GNF</span>
                  </div>
               </div>
            </div>

            {/* Espace de paiement Lengo Pay */}
            <div className="w-full overflow-hidden flex flex-col items-center justify-center min-h-[350px] border-2 border-primary/10 rounded-2xl relative bg-white">
              {paymentUrl ? (
                <>
                  <iframe 
                    src={paymentUrl} 
                    className="w-full h-[450px] border-0" 
                    allow="payment"
                    title="Lengo Pay"
                  />
                  <div className="absolute top-2 right-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => executeRecharge("Lengo Pay (Mode Démo)", "NMA-DEMO-2026")}
                      className="text-xs bg-white text-gray-500 hover:text-primary shadow-sm"
                    >
                      {lang === "en" ? "Bypass (Demo)" : "Bypass (Démo)"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">{lang === "en" ? "Secure Payment" : "Paiement Sécurisé"}</h3>
                  <p className="text-text-muted mb-6 max-w-sm text-sm">
                    {lang === "en" ? "You will be redirected to Lengo Pay to complete your top-up using Orange Money, Mobile Money, or Card." : "Vous allez être redirigé vers Lengo Pay pour finaliser votre recharge avec Orange Money, Mobile Money ou Carte."}
                  </p>
                  <Button 
                    size="lg" 
                    className="px-8 py-5 text-lg w-full max-w-xs shadow-md"
                    onClick={initLengoPay}
                    disabled={isLoading || montant <= 0}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                    {isLoading ? (lang === "en" ? "Initializing..." : "Initialisation...") : (lang === "en" ? "Pay now" : "Payer maintenant")}
                  </Button>
                </div>
              )}
            </div>

            {/* Erreur */}
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
                <AlertCircle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#991B1B" }}>{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-start pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()} disabled={isLoading || isProcessing}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
