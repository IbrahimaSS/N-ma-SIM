"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircle2, Info, Eye, Home, Printer, CheckCircle } from "lucide-react";

export default function Recu() {
  const router = useRouter();

  return (
    <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Message de succès */}
        <Card className="p-8 flex flex-col items-center text-center justify-center">
          <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center mb-6 shadow-lg shadow-success/30 relative">
             <CheckCircle className="w-12 h-12 text-white" />
             {/* Particules décoratives */}
             <div className="absolute top-2 right-2 w-2 h-2 bg-success rounded-full animate-ping"></div>
             <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-success rounded-full"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-primary mb-2">Demande enregistrée avec succès !</h2>
          <p className="text-text-muted mb-8">Votre demande de nouvelle SIM a été prise en compte.</p>
          
          <div className="w-full border-t border-b border-dashed border-border-light py-6 mb-6">
            <p className="text-4xl font-extrabold text-accent tracking-wider">NMA-2026-0001</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <span className="font-semibold text-text-muted">Statut :</span>
            <StatusBadge status="EN_ATTENTE_VALIDATION" />
          </div>

          <div className="w-full bg-primary/5 rounded-xl p-4 flex items-start gap-3 text-left">
            <Info className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
               <p className="font-bold text-primary mb-1">Veuillez patienter.</p>
               <p className="text-sm text-text-muted">Votre demande nécessite une validation admin si nécessaire.</p>
            </div>
          </div>
        </Card>

        {/* Reçu détaillé */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <h3 className="font-bold text-primary text-xl tracking-widest uppercase">Reçu de demande</h3>
            <p className="text-primary font-medium">Nouvelle SIM</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Nom du client</td>
                    <td className="py-3 text-text-muted text-right">Camara Mamadou</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Offre choisie</td>
                    <td className="py-3 text-text-muted text-right">SIM + Internet</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Montant payé</td>
                    <td className="py-3 text-text-muted text-right font-medium">20 000 GNF</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Référence paiement</td>
                    <td className="py-3 text-text-muted text-right">NMA-PAY-2026-001</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Numéro de ticket</td>
                    <td className="py-3 text-text-muted text-right">NMA-2026-0001</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-semibold text-primary">Date</td>
                    <td className="py-3 text-text-muted text-right">24/05/2026 à 14:30</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-primary">Statut</td>
                    <td className="py-3 text-right"><StatusBadge status="EN_ATTENTE_VALIDATION" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* QR Code */}
            <div className="w-40 h-40 bg-white border-2 border-border-light rounded-xl p-2 mx-auto flex-shrink-0 flex items-center justify-center">
              {/* Simulation QR Code simple via div patterns */}
              <div className="w-full h-full bg-[repeating-conic-gradient(#12005A_0_90deg,#fff_0_180deg)] bg-[length:12px_12px] opacity-80 rounded flex items-center justify-center">
                 <div className="w-10 h-10 bg-white flex items-center justify-center rounded">
                    <span className="text-[10px] font-bold text-primary">NMA</span>
                 </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex gap-4">
           <Button variant="outline" className="flex-1 bg-white h-14">
             <Eye className="w-5 h-5 mr-2" /> Voir le reçu
           </Button>
           <Button variant="primary" className="flex-1 h-14" onClick={() => router.push("/borne/accueil")}>
             <Home className="w-5 h-5 mr-2" /> Retour à l'accueil
           </Button>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="flex-1 bg-white h-14">
             <Printer className="w-5 h-5 mr-2" /> Imprimer
           </Button>
           <Button variant="primary" className="flex-1 h-14" onClick={() => router.push("/borne/accueil")}>
             <CheckCircle2 className="w-5 h-5 mr-2" /> Terminer
           </Button>
        </div>
      </div>
    </div>
  );
}
