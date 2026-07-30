"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock, CreditCard, Receipt, Wifi, ArrowLeft, ChevronRight, CheckCircle2, Camera, ScanLine, Loader2 } from "lucide-react";

export default function Paiement() {
  const router = useRouter();
  const [method, setMethod] = useState("orange-money");

  // États Orange Money
  const [omStep, setOmStep] = useState<"initial" | "requested">("initial");
  const [omPhone, setOmPhone] = useState("");
  const [omCode, setOmCode] = useState("");

  // États Visa
  const [visaStep, setVisaStep] = useState<"form" | "scanning">("form");
  const [visaData, setVisaData] = useState({ number: "", exp: "", cvv: "" });

  const handleOmRequest = () => {
    if (omPhone) {
      setOmStep("requested");
    }
  };

  const handleScanCard = () => {
    setVisaStep("scanning");
    setTimeout(() => {
      setVisaData({ number: "4567 8901 2345 6789", exp: "12/28", cvv: "" });
      setVisaStep("form");
    }, 3000);
  };

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Colonne 1: Détails de la commande */}
        <Card className="p-4">
          <h3 className="font-bold text-primary mb-4 text-base">Détails de la commande</h3>
          
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light">
              <Wifi className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Offre choisie</p>
              <p className="font-bold text-primary">SIM + Internet</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-gray-50 rounded-lg border border-border-light">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Montant</p>
              <p className="font-bold text-primary text-xl">20 000 GNF</p>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex justify-between items-center mb-6">
             <div className="flex items-center gap-2 text-primary font-semibold text-sm">
               Total à payer
             </div>
             <div className="font-bold text-primary text-lg">20 000 GNF</div>
          </div>

          {/* Mini encart sécurité */}
          <div className="flex flex-col gap-3 pt-6 border-t border-border-light">
            <div className="flex items-center gap-3 text-sm text-text-main">
               <ShieldCheck className="w-5 h-5 text-accent" /> Transactions 100% sécurisées.
            </div>
            <div className="flex items-center gap-3 text-sm text-text-main">
               <Lock className="w-5 h-5 text-primary" /> Données chiffrées et confidentielles.
            </div>
          </div>
        </Card>

        {/* Colonne 2: Modes de paiement */}
        <Card className="p-4">
          <h3 className="font-bold text-primary mb-4 text-base">Mode de paiement</h3>
          
          <div className="flex flex-col gap-4">
            {/* Orange Money */}
            <div 
              className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-colors ${method === 'orange-money' ? 'border-accent bg-accent/5' : 'border-border-light hover:border-primary/20'}`}
              onClick={() => { setMethod('orange-money'); setOmStep('initial'); }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'orange-money' ? 'border-accent' : 'border-gray-300'}`}>
                  {method === 'orange-money' && <div className="w-2.5 h-2.5 bg-accent rounded-full"></div>}
                </div>
                <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white font-bold text-xs">OM</div>
                <div>
                  <p className="font-bold text-primary">Orange Money</p>
                  <p className="text-xs text-text-muted">Paiement mobile rapide.</p>
                </div>
              </div>
            </div>

            {/* Carte Visa */}
            <div 
              className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-colors ${method === 'visa' ? 'border-primary bg-primary/5' : 'border-border-light hover:border-primary/20'}`}
              onClick={() => setMethod('visa')}
            >
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'visa' ? 'border-primary' : 'border-gray-300'}`}>
                  {method === 'visa' && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                </div>
                <div className="w-10 h-10 bg-[#1434CB] rounded-lg flex items-center justify-center text-white font-bold italic">VISA</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-primary">Carte Visa</p>
                  </div>
                  <p className="text-xs text-text-muted">Paiement par carte bancaire.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Colonne 3: Formulaire Dynamique */}
        <Card className="p-4">
          {method === 'orange-money' && (
            <div className="flex flex-col h-full">
              <h3 className="font-bold text-primary mb-6 text-lg text-center border-b border-border-light pb-4">Orange Money</h3>
              {omStep === 'initial' ? (
                <div className="flex flex-col gap-4 flex-grow">
                  <div>
                    <label className="text-sm font-semibold text-primary mb-2 block">Numéro de téléphone</label>
                    <input 
                      type="tel" 
                      placeholder="Ex: 620 00 00 00" 
                      className="w-full p-4 rounded-xl border border-border-light focus:border-accent outline-none bg-gray-50"
                      value={omPhone}
                      onChange={(e) => setOmPhone(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-grow"></div>
                  
                  <div className="bg-orange-50 p-4 rounded-xl mb-4 border border-orange-100">
                    <p className="text-sm text-[#FF6600] mb-1">Total à débiter</p>
                    <p className="text-2xl font-black text-[#FF6600]">20 000 GNF</p>
                  </div>

                  <Button onClick={handleOmRequest} className="w-full py-6 text-md bg-[#FF6600] hover:bg-[#E65C00] text-white shadow-md border-none" disabled={!omPhone}>
                    Envoyer la demande
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 flex-grow animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-success/10 border border-success/30 text-success p-4 rounded-xl flex items-start gap-3">
                     <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                     <div>
                       <p className="font-bold text-lg">Demande envoyée !</p>
                       <p className="text-sm mt-1">Veuillez consulter votre téléphone et entrer votre code secret Orange Money pour valider la transaction.</p>
                     </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-primary mb-2 block">Code de confirmation (reçu par SMS)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 1234" 
                      className="w-full p-4 rounded-xl border border-border-light focus:border-accent outline-none bg-gray-50 text-center tracking-widest text-lg font-bold"
                      value={omCode}
                      onChange={(e) => setOmCode(e.target.value)}
                      maxLength={4}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {method === 'visa' && (
            <div className="flex flex-col h-full">
              <h3 className="font-bold text-primary mb-6 text-lg text-center border-b border-border-light pb-4">Carte Bancaire</h3>
              {visaStep === 'scanning' ? (
                <div className="flex flex-col items-center justify-center flex-grow py-12 bg-gray-50 rounded-xl border-2 border-dashed border-primary/30 animate-in zoom-in-95">
                  <Camera className="w-16 h-16 text-primary mb-4 animate-pulse" />
                  <p className="font-bold text-primary mb-2 text-lg">Placez votre carte</p>
                  <p className="text-sm text-text-muted text-center px-6">Analyse optique (OCR) en cours. La caméra détecte vos informations...</p>
                  <Loader2 className="w-8 h-8 text-accent mt-6 animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 flex-grow animate-in fade-in duration-300">
                  <Button variant="outline" className="w-full mb-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10" onClick={handleScanCard}>
                    <ScanLine className="w-5 h-5 mr-2 text-accent" /> Scanner ma carte via caméra
                  </Button>
                  
                  <div className="relative">
                    <label className="text-xs font-semibold text-text-muted mb-1 block uppercase tracking-wider">Numéro de carte</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      className="w-full p-3 rounded-xl border border-border-light focus:border-accent outline-none font-mono text-primary bg-gray-50"
                      value={visaData.number}
                      onChange={(e) => setVisaData({...visaData, number: e.target.value})}
                    />
                    <CreditCard className="w-5 h-5 text-gray-400 absolute right-3 top-8" />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-text-muted mb-1 block uppercase tracking-wider">Expiration</label>
                      <input 
                        type="text" 
                        placeholder="MM/AA" 
                        className="w-full p-3 rounded-xl border border-border-light focus:border-accent outline-none font-mono text-primary bg-gray-50"
                        value={visaData.exp}
                        onChange={(e) => setVisaData({...visaData, exp: e.target.value})}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-text-muted mb-1 block uppercase tracking-wider">CVV</label>
                      <input 
                        type="password" 
                        placeholder="•••" 
                        className="w-full p-3 rounded-xl border border-border-light focus:border-accent outline-none font-mono text-center text-primary bg-gray-50"
                        value={visaData.cvv}
                        onChange={(e) => setVisaData({...visaData, cvv: e.target.value})}
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Footer Validation */}
      <div className="bg-white border border-border-light rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-3">
         <div>
            <p className="text-text-muted font-medium mb-1">Total à régler</p>
            <p className="text-3xl font-extrabold text-primary">20 000 GNF</p>
         </div>
         <div className="flex gap-4">
            <Button variant="secondary" className="h-14 px-6" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" /> Retour
            </Button>
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg shadow-md" 
              onClick={() => router.push("/borne/nouvelle-sim/recu")}
              disabled={(method === 'orange-money' && (!omCode || omCode.length < 4)) || (method === 'visa' && (!visaData.number || !visaData.cvv))}
            >
              Confirmer le paiement <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
         </div>
      </div>
    </div>
  );
}
