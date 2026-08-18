"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck, Lock, Receipt, RefreshCcw, ArrowLeft, ChevronRight,
  CheckCircle2, CreditCard, Camera, ScanLine, Loader2, AlertCircle, Phone
} from "lucide-react";

// Prix par défaut si le backend ne répond pas
const PRIX_DEFAUT = 10000;

export default function PaiementReactivation() {
  const router = useRouter();
  const [method, setMethod] = useState("orange-money");
  const [lang, setLang] = useState("fr");
  const [omStep, setOmStep] = useState<"initial" | "requested">("initial");
  const [omPhone, setOmPhone] = useState("");
  const [omCode, setOmCode] = useState("");
  const [visaStep, setVisaStep] = useState<"form" | "scanning">("form");
  const [visaData, setVisaData] = useState({ number: "", exp: "", cvv: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Données dynamiques
  const [prix, setPrix] = useState<number>(PRIX_DEFAUT);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [numero, setNumero] = useState("—");
  const [motif, setMotif] = useState("—");

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

    // Charger le tarif de réactivation depuis les paramètres
    fetch("/api/public/parametres")
      .then((r) => r.json())
      .then((data) => {
        const tarif =
          data?.tarif_reactivation ??
          data?.["Tarif réactivation"] ??
          PRIX_DEFAUT;
        setPrix(Number(tarif) || PRIX_DEFAUT);
      })
      .catch(() => setPrix(PRIX_DEFAUT))
      .finally(() => setIsLoadingPrice(false));
  }, []);

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
    payMethod: lang === "en" ? "Payment method" : "Mode de paiement",
    omFast: lang === "en" ? "Fast mobile payment." : "Paiement mobile rapide.",
    visaCard: lang === "en" ? "Visa Card" : "Carte Visa",
    visaFast: lang === "en" ? "Pay by bank card." : "Paiement par carte bancaire.",
    phoneNum: lang === "en" ? "Phone number" : "Numéro de téléphone",
    totalDebit: lang === "en" ? "Total to debit" : "Total à débiter",
    sendReq: lang === "en" ? "Send request" : "Envoyer la demande",
    reqSent: lang === "en" ? "Request sent!" : "Demande envoyée !",
    checkPhone: lang === "en" ? "Please check your phone and enter your Orange Money secret code." : "Veuillez consulter votre téléphone et entrer votre code secret Orange Money.",
    confirmCode: lang === "en" ? "Confirmation code (received by SMS)" : "Code de confirmation (reçu par SMS)",
    bankCard: lang === "en" ? "Bank Card" : "Carte Bancaire",
    placeCard: lang === "en" ? "Place your card" : "Placez votre carte",
    scanning: lang === "en" ? "OCR scan in progress..." : "Analyse optique (OCR) en cours...",
    scanCamera: lang === "en" ? "Scan my card via camera" : "Scanner ma carte via caméra",
    cardNum: lang === "en" ? "Card number" : "Numéro de carte",
    expiry: lang === "en" ? "Expiry" : "Expiration",
    totalDue: lang === "en" ? "Total due" : "Total à régler",
    back: lang === "en" ? "Back" : "Retour",
    confirmPay: lang === "en" ? "Confirm payment" : "Confirmer le paiement",
    processing: lang === "en" ? "Processing..." : "Traitement en cours...",
  };

  const handleOmRequest = () => { if (omPhone) setOmStep("requested"); };
  const handleScanCard = () => {
    setVisaStep("scanning");
    setTimeout(() => { setVisaData({ number: "4567 8901 2345 6789", exp: "12/28", cvv: "" }); setVisaStep("form"); }, 3000);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError("");
    try {
      const kycInfo = JSON.parse(sessionStorage.getItem("kiosk_client_info") || "{}");
      const kycChampsRaw = sessionStorage.getItem("kyc_champs");
      const kycChamps = kycChampsRaw ? JSON.parse(kycChampsRaw) : {};
      const numeroAReactiver = sessionStorage.getItem("reactivation_numero") || "";
      const motifReactivation = sessionStorage.getItem("reactivation_motif") || "";

      const res = await fetch("/api/soumettre-reactivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_info: { ...kycInfo, ...kycChamps },
          numero_a_reactiver: numeroAReactiver,
          motif_reactivation: motifReactivation,
          paiement: {
            montant: prix,
            methode: method,
            reference: method === "orange-money" ? omCode : "VISA_TEST",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur serveur");

      sessionStorage.setItem("ticket_ref", data.numeroDossier);
      sessionStorage.setItem("demande_id", data.demandeId);
      // Nettoyage
      sessionStorage.removeItem("kiosk_client_info");
      sessionStorage.removeItem("kyc_champs");
      router.push("/borne/reactivation/recu");
    } catch (err: unknown) {
      console.error("[REACTIVATION]", err);
      setError(lang === "en"
        ? "An error occurred during validation. Please try again."
        : "Une erreur est survenue lors de la validation. Veuillez réessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
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

        {/* ── Mode de paiement ── */}
        <Card className="p-4">
          <h3 className="font-bold text-primary mb-4 text-base">{t.payMethod}</h3>
          <div className="flex flex-col gap-4">
            <div
              className={`p-4 rounded-xl border-2 flex items-center cursor-pointer transition-colors ${method === "orange-money" ? "border-accent bg-accent/5" : "border-border-light hover:border-primary/20"}`}
              onClick={() => { setMethod("orange-money"); setOmStep("initial"); }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === "orange-money" ? "border-accent" : "border-gray-300"}`}>
                  {method === "orange-money" && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                </div>
                <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white font-bold text-xs">OM</div>
                <div><p className="font-bold text-primary">Orange Money</p><p className="text-xs text-text-muted">{t.omFast}</p></div>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border-2 flex items-center cursor-pointer transition-colors ${method === "visa" ? "border-primary bg-primary/5" : "border-border-light hover:border-primary/20"}`}
              onClick={() => setMethod("visa")}
            >
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === "visa" ? "border-primary" : "border-gray-300"}`}>
                  {method === "visa" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                </div>
                <div className="w-10 h-10 bg-[#1434CB] rounded-lg flex items-center justify-center text-white font-bold italic">VISA</div>
                <div><p className="font-bold text-primary">{t.visaCard}</p><p className="text-xs text-text-muted">{t.visaFast}</p></div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Panneau de saisie paiement ── */}
        <Card className="p-4">
          {method === "orange-money" && (
            <div className="flex flex-col h-full">
              <h3 className="font-bold text-primary mb-6 text-lg text-center border-b border-border-light pb-4">Orange Money</h3>
              {omStep === "initial" ? (
                <div className="flex flex-col gap-4 flex-grow">
                  <div>
                    <label className="text-sm font-semibold text-primary mb-2 block">{t.phoneNum}</label>
                    <input type="tel" placeholder="Ex: 620 00 00 00" className="w-full p-4 rounded-xl border border-border-light focus:border-accent outline-none bg-gray-50" value={omPhone} onChange={(e) => setOmPhone(e.target.value)} disabled={isProcessing} />
                  </div>
                  <div className="flex-grow" />
                  <div className="bg-orange-50 p-4 rounded-xl mb-4 border border-orange-100">
                    <p className="text-sm text-[#FF6600] mb-1">{t.totalDebit}</p>
                    <p className={`text-2xl font-black text-[#FF6600] ${isLoadingPrice ? "animate-pulse" : ""}`}>{prixFormate}</p>
                  </div>
                  <Button onClick={handleOmRequest} className="w-full py-6 text-md bg-[#FF6600] hover:bg-[#E65C00] text-white shadow-md border-none" disabled={!omPhone || isProcessing || isLoadingPrice}>
                    {t.sendReq}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 flex-grow animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-success/10 border border-success/30 text-success p-4 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                    <div><p className="font-bold text-lg">{t.reqSent}</p><p className="text-sm mt-1">{t.checkPhone}</p></div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-primary mb-2 block">{t.confirmCode}</label>
                    <input type="text" placeholder="Ex: 1234" className="w-full p-4 rounded-xl border border-border-light focus:border-accent outline-none bg-gray-50 text-center tracking-widest text-lg font-bold" value={omCode} onChange={(e) => setOmCode(e.target.value)} maxLength={4} disabled={isProcessing} />
                  </div>
                </div>
              )}
            </div>
          )}

          {method === "visa" && (
            <div className="flex flex-col h-full">
              <h3 className="font-bold text-primary mb-6 text-lg text-center border-b border-border-light pb-4">{t.bankCard}</h3>
              {visaStep === "scanning" ? (
                <div className="flex flex-col items-center justify-center flex-grow py-12 bg-gray-50 rounded-xl border-2 border-dashed border-primary/30">
                  <Camera className="w-16 h-16 text-primary mb-4 animate-pulse" />
                  <p className="font-bold text-primary mb-2 text-lg">{t.placeCard}</p>
                  <p className="text-sm text-text-muted text-center px-6">{t.scanning}</p>
                  <Loader2 className="w-8 h-8 text-accent mt-6 animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 flex-grow">
                  <Button variant="outline" className="w-full mb-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10" onClick={handleScanCard} disabled={isProcessing}>
                    <ScanLine className="w-5 h-5 mr-2 text-accent" /> {t.scanCamera}
                  </Button>
                  <div className="relative">
                    <label className="text-xs font-semibold text-text-muted mb-1 block uppercase tracking-wider">{t.cardNum}</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 rounded-xl border border-border-light focus:border-accent outline-none font-mono text-primary bg-gray-50" value={visaData.number} onChange={(e) => setVisaData({ ...visaData, number: e.target.value })} disabled={isProcessing} />
                    <CreditCard className="w-5 h-5 text-gray-400 absolute right-3 top-8" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-text-muted mb-1 block uppercase tracking-wider">{t.expiry}</label>
                      <input type="text" placeholder="MM/AA" className="w-full p-3 rounded-xl border border-border-light focus:border-accent outline-none font-mono text-primary bg-gray-50" value={visaData.exp} onChange={(e) => setVisaData({ ...visaData, exp: e.target.value })} disabled={isProcessing} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-text-muted mb-1 block uppercase tracking-wider">CVV</label>
                      <input type="password" placeholder="•••" className="w-full p-3 rounded-xl border border-border-light focus:border-accent outline-none font-mono text-center text-primary bg-gray-50" value={visaData.cvv} onChange={(e) => setVisaData({ ...visaData, cvv: e.target.value })} maxLength={3} disabled={isProcessing} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      {/* Barre de bas de page */}
      <div className="bg-white border border-border-light rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-3">
        <div>
          <p className="text-text-muted font-medium mb-1">{t.totalDue}</p>
          <p className={`text-3xl font-extrabold text-primary ${isLoadingPrice ? "animate-pulse" : ""}`}>{prixFormate}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" className="h-14 px-6" onClick={() => router.back()} disabled={isProcessing}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button
            size="lg"
            className="h-14 px-8 text-lg shadow-md"
            onClick={handleConfirm}
            disabled={
              isProcessing || isLoadingPrice ||
              (method === "orange-money" && (!omCode || omCode.length < 4)) ||
              (method === "visa" && (!visaData.number || !visaData.cvv))
            }
          >
            {isProcessing
              ? <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> {t.processing}</>
              : <>{t.confirmPay} <ChevronRight className="w-6 h-6 ml-2" /></>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
