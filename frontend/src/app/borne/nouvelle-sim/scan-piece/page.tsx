"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Camera, CheckCircle2, Info, ChevronRight, ArrowLeft } from "lucide-react";

export default function ScanPiece() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
  }, []);

  const t = {
    title: lang === "en" ? "Step 1/6 — ID Document Scan" : "Étape 1/6 — Scan de la pièce d'identité",
    subtitle: lang === "en" ? "Scan or import your document to launch AI / OCR analysis." : "Scannez ou importez votre pièce pour lancer l'analyse IA / OCR.",
    importImg: lang === "en" ? "Import an image" : "Importer une image",
    importSub: lang === "en" ? "Upload a file (JPG, PNG)" : "Téléchargez un fichier (JPG, PNG)",
    takePhoto: lang === "en" ? "Take a photo" : "Prendre une photo",
    takeSub: lang === "en" ? "Use your camera" : "Utilisez votre caméra",
    preview: lang === "en" ? "Document preview" : "Aperçu du document",
    aiAnalysis: lang === "en" ? "AI / OCR Analysis" : "Analyse IA / OCR",
    readable: lang === "en" ? "Document readable" : "Document lisible",
    detected: lang === "en" ? "Document detected" : "Document détecté",
    clear: lang === "en" ? "Clear image" : "Image nette",
    legible: lang === "en" ? "Legible text" : "Texte lisible",
    info: lang === "en" ? "Information will be pre-filled automatically after analysis." : "Les informations seront pré-remplies automatiquement après l'analyse.",
    back: lang === "en" ? "Back" : "Retour",
    extract: lang === "en" ? "Extract information" : "Extraire les informations",
  };

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <p className="text-text-muted mt-2">{t.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <button className="flex flex-col items-center justify-center p-4 min-h-[52px] border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group">
            <Upload className="w-8 h-8 text-primary mb-2 group-hover:-translate-y-1 transition-transform" />
            <span className="font-bold text-primary">{t.importImg}</span>
            <span className="text-xs text-text-muted">{t.importSub}</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 min-h-[52px] border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group">
            <Camera className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-primary">{t.takePhoto}</span>
            <span className="text-xs text-text-muted">{t.takeSub}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="border border-border-light rounded-xl p-6 bg-gray-50 flex flex-col">
            <h4 className="font-bold text-text-main mb-4">{t.preview}</h4>
            <div className="w-full h-36 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
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

          <div className="border border-border-light rounded-xl p-6 flex flex-col">
            <h4 className="font-bold text-text-main mb-4">{t.aiAnalysis}</h4>
            <div className="bg-success/15 border border-success/30 rounded-xl p-4 flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <span className="font-bold text-success text-lg">{t.readable}</span>
            </div>
            <div className="flex flex-col gap-3 mb-6 flex-grow">
              <div className="flex items-center gap-3 text-sm text-text-main"><CheckCircle2 className="w-5 h-5 text-success" /> {t.detected}</div>
              <div className="flex items-center gap-3 text-sm text-text-main"><CheckCircle2 className="w-5 h-5 text-success" /> {t.clear}</div>
              <div className="flex items-center gap-3 text-sm text-text-main"><CheckCircle2 className="w-5 h-5 text-success" /> {t.legible}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex gap-3 text-sm text-text-muted border border-border-light">
              <Info className="w-5 h-5 text-primary flex-shrink-0" />
              <p>{t.info}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button onClick={() => router.push("/borne/nouvelle-sim/confirmation-infos")}>
            {t.extract} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
