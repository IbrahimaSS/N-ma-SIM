"use client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ChevronRight, ArrowLeft, Hourglass, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function Verification() {
  const router = useRouter();

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-8 text-center">
        <CardTitle className="text-3xl text-primary font-bold">Réactivation des puces</CardTitle>
        <p className="text-text-muted mt-2">Nous vérifions les informations fournies pour sécuriser votre réactivation.</p>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Résumé */}
        <div>
           <div className="flex justify-between items-center bg-gray-50 p-4 rounded-t-xl border border-b-0 border-border-light">
              <h3 className="font-bold text-primary text-lg">Résumé des informations</h3>
              <Button variant="secondary" size="sm" className="bg-white">Modifier</Button>
           </div>
           <div className="border border-border-light rounded-b-xl overflow-hidden divide-y divide-border-light bg-white">
              <div className="flex justify-between items-center p-4">
                 <div>
                   <p className="text-xs text-text-muted font-semibold">Numéro à réactiver</p>
                   <p className="font-bold text-primary">06 12 34 56 78</p>
                 </div>
                 <StatusBadge status="CONFIRME" />
              </div>
              <div className="flex justify-between items-center p-4">
                 <div>
                   <p className="text-xs text-text-muted font-semibold">Motif</p>
                   <p className="font-bold text-primary">Perte de la carte SIM</p>
                 </div>
                 <StatusBadge status="CONFIRME" />
              </div>
              <div className="flex justify-between items-center p-4">
                 <div>
                   <p className="text-xs text-text-muted font-semibold">Identité extraite</p>
                   <p className="font-bold text-primary">Jean Paul KOUASSI</p>
                 </div>
                 <StatusBadge status="VALIDEE" />
              </div>
           </div>
        </div>

        {/* Contrôle de ligne */}
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-8">
           <div className="flex items-start gap-4 mb-8">
              <div className="bg-accent/20 p-3 rounded-full flex-shrink-0">
                 <Hourglass className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-primary">Contrôle de ligne en cours</h3>
                 <p className="text-text-muted text-sm mt-1">Nous vérifions l'éligibilité de votre ligne auprès de l'opérateur.</p>
              </div>
           </div>

           <div className="flex flex-col gap-6 mb-8">
              <div className="flex gap-3">
                 <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                 <div>
                    <p className="font-bold text-primary text-sm">Analyse IA réussie</p>
                    <p className="text-xs text-text-muted">Les documents et le selfie ont été analysés avec succès.</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                 <div>
                    <p className="font-bold text-primary text-sm">Correspondance visage / document validée</p>
                    <p className="text-xs text-text-muted">La correspondance a été confirmée par notre système IA.</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <Hourglass className="w-5 h-5 text-warning flex-shrink-0 mt-0.5 animate-spin-slow" />
                 <div>
                    <p className="font-bold text-primary text-sm">Vérification opérateur en cours</p>
                    <p className="text-xs text-text-muted">Nous vérifions l'éligibilité de votre ligne auprès de l'opérateur.</p>
                 </div>
              </div>
           </div>

           <div className="bg-warning/10 p-4 rounded-xl flex items-center gap-3 text-warning border border-warning/20">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">Veuillez patienter, cela peut prendre quelques instants.</p>
           </div>
        </div>

        <div className="col-span-1 lg:col-span-2 flex justify-between items-center pt-4 border-t border-border-light mt-4">
           <Button variant="secondary" onClick={() => router.back()}>
             <ArrowLeft className="w-5 h-5 mr-2" /> Retour
           </Button>
           <Button onClick={() => router.push("/borne/reactivation/paiement")} className="px-10 h-12 shadow-sm">
             Continuer <ChevronRight className="w-5 h-5 ml-2" />
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
