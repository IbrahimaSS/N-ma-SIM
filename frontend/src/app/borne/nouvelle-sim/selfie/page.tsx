"use client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Camera, CheckCircle2, Info, ChevronRight, ArrowLeft } from "lucide-react";

export default function Selfie() {
  const router = useRouter();

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl text-center">Étape 3/6 — Vérification photo</CardTitle>
        <p className="text-text-muted mt-2 text-center">Prenez un selfie ou importez une photo nette de votre visage.</p>
      </CardHeader>
      
      <CardContent>
        {/* Boutons d'action haut */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <button className="flex items-center justify-center gap-4 p-4 min-h-[52px] border border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group bg-white shadow-sm">
            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-primary">Prendre un selfie</span>
              <span className="text-xs text-text-muted">Utilisez la caméra</span>
            </div>
          </button>
          <button className="flex items-center justify-center gap-4 p-4 min-h-[52px] border border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group bg-white shadow-sm">
            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-primary">Importer une photo</span>
              <span className="text-xs text-text-muted">Formats acceptés : JPG, PNG</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Aperçu visage */}
          <div className="rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center" style={{ height: "clamp(200px, 28vh, 280px)" }}>
            {/* Simulation image visage */}
            <div className="w-full h-full bg-slate-300 relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-500">
                 {/* Placeholder for Face Image */}
                 <div className="w-32 h-40 bg-slate-400 rounded-[50%] mb-4 opacity-50"></div>
                 <p className="font-bold">Aperçu Caméra</p>
              </div>
            </div>
          </div>

          {/* Comparaison Visage */}
          <div className="border border-border-light rounded-xl p-6 flex flex-col bg-white">
            <h4 className="font-bold text-text-main mb-4">Comparaison visage / document</h4>
            
            <div className="bg-success/15 border border-success/30 rounded-xl p-4 flex items-center gap-3 mb-6">
              <span className="font-bold text-success text-lg flex-grow">Visage détecté</span>
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>

            <div className="flex flex-col gap-4 mb-6 flex-grow">
              <div className="flex items-center gap-3 text-sm text-text-main font-medium">
                <CheckCircle2 className="w-5 h-5 text-success" /> 1 visage détecté
              </div>
              <div className="flex items-center gap-3 text-sm text-text-main font-medium">
                <CheckCircle2 className="w-5 h-5 text-success" /> Image nette
              </div>
              <div className="flex items-center gap-3 text-sm text-text-main font-medium">
                <CheckCircle2 className="w-5 h-5 text-success" /> Photo acceptée
              </div>
              <div className="flex items-center gap-3 text-sm text-text-main font-medium">
                <CheckCircle2 className="w-5 h-5 text-success" /> Correspondance avec le document
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg flex gap-3 text-sm text-primary border border-primary/20">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>En cas de doute, la demande passera en validation humaine.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light mt-8">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </Button>
          <Button onClick={() => router.push("/borne/nouvelle-sim/offres")} className="px-10">
            Continuer <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
