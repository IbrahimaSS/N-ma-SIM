"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock, CreditCard, Receipt, Wifi, ArrowLeft, ChevronRight, CheckCircle2, Camera, ScanLine, Loader2 } from "lucide-react";
import { MOCK_OFFERS } from "@/data/mock-data";
import type { Offer } from "@/types";

export default function Paiement() {
  const router = useRouter();
  const [method, setMethod] = useState("orange-money");
  const [lang, setLang] = useState("fr");
  // Offre sélectionnée — chargée depuis sessionStorage (page offres)
  const [offer, setOffer] = useState<Offer>(MOCK_OFFERS[0]);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Écouter le message de succès de l'Iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "LENGO_PAY_SUCCESS") {
        const paymentInfo = {
          method: "Lengo Pay",
          reference: event.data?.pay_id || "NMA-PAY-LENG-01"
        };
        sessionStorage.setItem("kiosk_payment", JSON.stringify(paymentInfo));
        router.push("/borne/nouvelle-sim/recu");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    // Charger l'offre choisie depuis sessionStorage
    try {
      const raw = sessionStorage.getItem("kiosk_offer");
      if (raw) {
        const parsed = JSON.parse(raw) as Offer;
        setOffer(parsed);
      }
    } catch { /* garder l'offre par défaut */ }
  }, []);

  const t = {
    orderDetails: lang === "en" ? "Order details" : "Détails de la commande",
    offer: lang === "en" ? "Selected offer" : "Offre choisie",
    amount: lang === "en" ? "Amount" : "Montant",
    total: lang === "en" ? "Total to pay" : "Total à payer",
    secure: lang === "en" ? "100% secure transactions." : "Transactions 100% sécurisées.",
    encrypted: lang === "en" ? "Encrypted and confidential data." : "Données chiffrées et confidentielles.",
    payMethod: lang === "en" ? "Payment method" : "Mode de paiement",
    omFast: lang === "en" ? "Fast mobile payment." : "Paiement mobile rapide.",
    visaCard: lang === "en" ? "Visa Card" : "Carte Visa",
    visaFast: lang === "en" ? "Pay by bank card." : "Paiement par carte bancaire.",
    phoneNumber: lang === "en" ? "Phone number" : "Numéro de téléphone",
    totalDebit: lang === "en" ? "Total to debit" : "Total à débiter",
    sendRequest: lang === "en" ? "Send request" : "Envoyer la demande",
    requestSent: lang === "en" ? "Request sent!" : "Demande envoyée !",
    checkPhone: lang === "en" ? "Please check your phone and enter your Orange Money secret code to validate the transaction." : "Veuillez consulter votre téléphone et entrer votre code secret Orange Money pour valider la transaction.",
    confirmCode: lang === "en" ? "Confirmation code (received by SMS)" : "Code de confirmation (reçu par SMS)",
    bankCard: lang === "en" ? "Bank Card" : "Carte Bancaire",
    placeCard: lang === "en" ? "Place your card" : "Placez votre carte",
    scanning: lang === "en" ? "Optical scan (OCR) in progress. The camera detects your information..." : "Analyse optique (OCR) en cours. La caméra détecte vos informations...",
    scanCamera: lang === "en" ? "Scan my card via camera" : "Scanner ma carte via caméra",
    cardNumber: lang === "en" ? "Card number" : "Numéro de carte",
    expiry: lang === "en" ? "Expiry" : "Expiration",
    back: lang === "en" ? "Back" : "Retour",
    totalToPay: lang === "en" ? "Total due" : "Total à régler",
    confirmPayment: lang === "en" ? "Confirm payment" : "Confirmer le paiement",
  };

  const initLengoPay = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: offer.prixGNF, currency: "GNF" })
      });
      const data = await res.json();
      if (data.payment_url) {
        setPaymentUrl(data.payment_url);
      } else {
        alert("Erreur lors de l'initialisation du paiement.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Colonne 1 */}
        <Card className="p-4">
          <h3 className="font-bold text-primary mb-4 text-base">{t.orderDetails}</h3>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light"><Wifi className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-text-muted">{t.offer}</p><p className="font-bold text-primary">{offer.titre}</p></div>
          </div>
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light"><Receipt className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-text-muted">{t.amount}</p><p className="font-bold text-primary text-xl">{offer.prixGNF.toLocaleString('fr-FR')} GNF</p></div>
          </div>
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">{t.total}</div>
            <div className="font-bold text-primary text-lg">{offer.prixGNF.toLocaleString('fr-FR')} GNF</div>
          </div>
          <div className="flex flex-col gap-3 pt-6 border-t border-border-light">
            <div className="flex items-center gap-3 text-sm text-text-main"><ShieldCheck className="w-5 h-5 text-accent" /> {t.secure}</div>
            <div className="flex items-center gap-3 text-sm text-text-main"><Lock className="w-5 h-5 text-primary" /> {t.encrypted}</div>
          </div>
        </Card>

        {/* Espace de paiement Lengo Pay */}
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
                  onClick={() => {
                    const paymentInfo = { method: "Lengo Pay (Mode Démo)", reference: "NMA-DEMO-2026" };
                    sessionStorage.setItem("kiosk_payment", JSON.stringify(paymentInfo));
                    router.push("/borne/nouvelle-sim/recu");
                  }}
                  className="text-xs bg-white text-gray-500 hover:text-primary shadow-sm"
                >
                  Bypass (Mode Démo)
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
                Vous allez être redirigé vers la passerelle sécurisée Lengo Pay pour finaliser votre commande avec Orange Money, Mobile Money ou Carte Bancaire.
              </p>
              <Button 
                size="lg" 
                className="px-10 py-6 text-lg w-full max-w-sm shadow-md"
                onClick={initLengoPay}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <ShieldCheck className="w-6 h-6 mr-2" />}
                {isLoading ? "Initialisation..." : "Payer maintenant"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="bg-white border border-border-light rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-3">
        <div>
          <p className="text-text-muted font-medium mb-1">{t.totalToPay}</p>
          <p className="text-3xl font-extrabold text-primary">{offer.prixGNF.toLocaleString('fr-FR')} GNF</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" className="h-14 px-6" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
        </div>
      </div>
    </div>
  );
}
