"use client";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircle2, Info, Eye, Home, Printer, CheckCircle, Loader2 } from "lucide-react";
import { SuccessScreen } from "@/components/borne/SuccessScreen";

export default function RecuReactivation() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecuContent />
    </Suspense>
  );
}

function RecuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";
  
  const [ticketRef, setTicketRef] = useState("NMA-RE-0000");
  const [demandeId, setDemandeId] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    setTicketRef(sessionStorage.getItem("ticket_ref") || "NMA-RE-0000");
    setDemandeId(sessionStorage.getItem("demande_id") || "");
  }, []);

  const handleFinish = async () => {
    if (!demandeId) {
      router.push("?success=true");
      return;
    }
    
    setIsFinishing(true);
    try {
      await fetch(`/api/terminer-demande`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandeId }),
      });
    } catch (err) {
      console.error("[TERMINER]", err);
    } finally {
      setIsFinishing(false);
      router.push("?success=true");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (showSuccess) {
    return <SuccessScreen type="reactivation" ticketRef={ticketRef} />;
  }

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 no-print">
        {/* Message de succès */}
        <Card className="p-8 flex flex-col items-center text-center justify-center">
          <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center mb-6 shadow-lg shadow-success/30 relative">
             <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-primary mb-2">Demande enregistrée avec succès !</h2>
          <p className="text-text-muted mb-8">Votre réactivation de puce est en cours de traitement final.</p>
          
          <div className="w-full border-t border-b border-dashed border-border-light py-6 mb-6">
            <p className="text-4xl font-extrabold text-accent tracking-wider">{ticketRef}</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <span className="font-semibold text-text-muted">Statut :</span>
            <StatusBadge status="VALIDEE" />
          </div>

          <div className="w-full bg-primary/5 rounded-xl p-4 flex items-start gap-3 text-left">
            <Info className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
               <p className="font-bold text-primary mb-1">Puce en cours d&apos;activation.</p>
               <p className="text-sm text-text-muted">Votre réseau sera disponible dans les 5 prochaines minutes.</p>
            </div>
          </div>
        </Card>

        {/* Reçu détaillé (Aperçu) */}
        <Card className="p-8" id="receipt-content">
          <div className="text-center mb-8">
            <h3 className="font-bold text-primary text-xl tracking-widest uppercase">Reçu de demande</h3>
            <p className="text-primary font-medium">Réactivation SIM</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Service</td>
                    <td className="py-3 text-text-muted text-right font-bold text-primary">Réactivation</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Montant payé</td>
                    <td className="py-3 text-text-muted text-right font-medium">10 000 GNF</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Numéro de ticket</td>
                    <td className="py-3 text-text-muted text-right font-bold">{ticketRef}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Date</td>
                    <td className="py-3 text-text-muted text-right">{new Date().toLocaleString('fr-FR')}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-primary">Statut</td>
                    <td className="py-3 text-right"><StatusBadge status="VALIDEE" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* QR Code */}
            <div className="w-40 h-40 bg-white border-2 border-border-light rounded-xl p-2 mx-auto flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[repeating-conic-gradient(#1F0270_0_90deg,#fff_0_180deg)] bg-[length:12px_12px] opacity-80 rounded flex items-center justify-center">
                 <div className="w-10 h-10 bg-white flex items-center justify-center rounded">
                    <span className="text-[10px] font-bold text-primary">NMA</span>
                 </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="flex gap-4">
           <Button variant="outline" className="flex-1 bg-white h-14" onClick={() => {
              const el = document.getElementById("receipt-content");
              if (el) el.scrollIntoView({ behavior: 'smooth' });
           }}>
             <Eye className="w-5 h-5 mr-2" /> Voir le reçu
           </Button>
           <Button variant="primary" className="flex-1 h-14" onClick={() => router.push("/borne/accueil")}>
             <Home className="w-5 h-5 mr-2" /> Retour à l&apos;accueil
           </Button>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="flex-1 bg-white h-14" onClick={handlePrintPDF}>
             <Printer className="w-5 h-5 mr-2" /> Imprimer
           </Button>
           <Button variant="primary" className="flex-1 h-14" onClick={handleFinish} disabled={isFinishing}>
             {isFinishing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finalisation...</> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Terminer</>}
           </Button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
