"use client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Camera, CheckCircle2, Info, ChevronRight, ArrowLeft } from "lucide-react";

export default function ScanPiece() {
  const router = useRouter();

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-2xl">Étape 1/6 — Scan de la pièce d'identité</CardTitle>
          <p className="text-text-muted mt-2">Scannez ou importez votre pièce pour lancer l'analyse IA / OCR.</p>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Boutons d'action haut */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group">
            <Upload className="w-8 h-8 text-primary mb-2 group-hover:-translate-y-1 transition-transform" />
            <span className="font-bold text-primary">Importer une image</span>
            <span className="text-xs text-text-muted">Téléchargez un fichier (JPG, PNG)</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group">
            <Camera className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-primary">Prendre une photo</span>
            <span className="text-xs text-text-muted">Utilisez votre caméra</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Aperçu */}
          <div className="border border-border-light rounded-xl p-6 bg-gray-50 flex flex-col">
            <h4 className="font-bold text-text-main mb-4">Aperçu du document</h4>
            <div className="w-full h-48 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
              {/* Simulation de carte scannée */}
              <div className="w-[85%] h-[70%] bg-pink-50/50 rounded flex relative border border-pink-100">
                <div className="w-16 h-20 bg-gray-200 rounded absolute left-4 top-1/2 -translate-y-1/2"></div>
                <div className="flex flex-col gap-2 absolute left-24 top-6">
                  <div className="h-2 w-32 bg-gray-300 rounded"></div>
                  <div className="h-3 w-40 bg-gray-800 rounded"></div>
                  <div className="h-2 w-24 bg-gray-300 rounded mt-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Analyse IA */}
          <div className="border border-border-light rounded-xl p-6 flex flex-col">
            <h4 className="font-bold text-text-main mb-4">Analyse IA / OCR</h4>
            
            <div className="bg-success/15 border border-success/30 rounded-xl p-4 flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <span className="font-bold text-success text-lg">Document lisible</span>
            </div>

            <div className="flex flex-col gap-3 mb-6 flex-grow">
              <div className="flex items-center gap-3 text-sm text-text-main">
                <CheckCircle2 className="w-5 h-5 text-success" /> Document détecté
              </div>
              <div className="flex items-center gap-3 text-sm text-text-main">
                <CheckCircle2 className="w-5 h-5 text-success" /> Image nette
              </div>
              <div className="flex items-center gap-3 text-sm text-text-main">
                <CheckCircle2 className="w-5 h-5 text-success" /> Texte lisible
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex gap-3 text-sm text-text-muted border border-border-light">
              <Info className="w-5 h-5 text-primary flex-shrink-0" />
              <p>Les informations seront pré-remplies automatiquement après l'analyse.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </Button>
          <Button onClick={() => router.push("/borne/nouvelle-sim/confirmation-infos")}>
            Extraire les informations <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
