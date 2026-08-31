"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock, CreditCard, Receipt, ArrowLeft, Loader2, Smartphone } from "lucide-react";
import type { EsimForfait } from "@/data/esim-forfaits";

export default function EsimPaiement() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [forfait, setForfait] = useState<EsimForfait | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "LENGO_PAY_SUCCESS") {
        const paymentInfo = {
          method: "Lengo Pay",
          reference: event.data?.pay_id || "NMA-PAY-LENG-ESIM-01"
        };
        sessionStorage.setItem("kiosk_payment", JSON.stringify(paymentInfo));
        router.push("/borne/nouvelle-sim/esim/generation");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    try {
      const raw = sessionStorage.getItem("kiosk_esim_forfait");
      if (raw) setForfait(JSON.parse(raw));
    } catch {}

    if (!sessionStorage.getItem("kiosk_esim_recap_ok")) {
      router.replace("/borne/nouvelle-sim/esim/recapitulatif");
    }
  }, [router]);

  const t = {
    orderDetails: lang === "en" ? "Order details" : "Détails de la commande",
    offer: lang === "en" ? "Selected eSIM plan" : "Forfait eSIM choisi",
    amount: lang === "en" ? "Amount" : "Montant",
    total: lang === "en" ? "Total to pay" : "Total à payer",
    secure: lang === "en" ? "100% secure transactions." : "Transactions 100% sécurisées.",
    encrypted: lang === "en" ? "Encrypted and confidential data." : "Données chiffrées et confidentielles.",
    back: lang === "en" ? "Back" : "Retour",
    totalToPay: lang === "en" ? "Total due" : "Total à régler",
  };

  const goDemo = () => {
    const paymentInfo = { method: "Lengo Pay (Mode Démo)", reference: "NMA-DEMO-2026-ESIM" };
    sessionStorage.setItem("kiosk_payment", JSON.stringify(paymentInfo));
    router.push("/borne/nouvelle-sim/esim/generation");
  };

  const initLengoPay = async () => {
    if (!forfait) return;
    setIsLoading(true);
    setInitError(false);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch("/api/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: forfait.prixGNF, currency: "GNF" }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (data.payment_url) {
        setPaymentUrl(data.payment_url);
      } else {
        setInitError(true);
      }
    } catch (err) {
      // Passerelle injoignable (hors-ligne, sandbox indisponible…) : on propose le mode démo
      console.error(err);
      setInitError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!forfait) return null;

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Colonne 1 */}
        <Card className="p-4">
          <h3 className="font-bold text-primary mb-4 text-base">{t.orderDetails}</h3>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light"><Smartphone className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-text-muted">{t.offer}</p><p className="font-bold text-primary">{forfait.nom}</p></div>
          </div>
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light"><Receipt className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-text-muted">{t.amount}</p><p className="font-bold text-primary text-xl">{forfait.prixGNF.toLocaleString('fr-FR')} GNF</p></div>
          </div>
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">{t.total}</div>
            <div className="font-bold text-primary text-lg">{forfait.prixGNF.toLocaleString('fr-FR')} GNF</div>
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
              <div className="w-full p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={goDemo}
                  className="w-full max-w-sm bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 shadow-sm font-bold text-base h-14"
                >
                  {lang === "en" ? "Bypass Payment (Demo Mode)" : "Bypass Paiement (Mode Démo)"}
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

              {initError && (
                <div className="mt-6 w-full max-w-sm">
                  <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    {lang === "en"
                      ? "Payment gateway unreachable. You can continue in demo mode."
                      : "Passerelle de paiement injoignable. Vous pouvez poursuivre en mode démo."}
                  </p>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={goDemo}
                    className="w-full bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 shadow-sm font-bold text-base h-14"
                  >
                    {lang === "en" ? "Bypass Payment (Demo Mode)" : "Bypass Paiement (Mode Démo)"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="bg-white border border-border-light rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-3">
        <div>
          <p className="text-text-muted font-medium mb-1">{t.totalToPay}</p>
          <p className="text-3xl font-extrabold text-primary">{forfait.prixGNF.toLocaleString('fr-FR')} GNF</p>
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
