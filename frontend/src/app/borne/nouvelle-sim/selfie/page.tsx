"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Camera, CheckCircle2, Info, ChevronRight, ArrowLeft } from "lucide-react";

export default function Selfie() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
  }, []);

  const t = {
    title: lang === "en" ? "Step 3/6 — Photo verification" : "Étape 3/6 — Vérification photo",
    subtitle: lang === "en" ? "Take a selfie or import a clear photo of your face." : "Prenez un selfie ou importez une photo nette de votre visage.",
    takeSelfie: lang === "en" ? "Take a selfie" : "Prendre un selfie",
    useCamera: lang === "en" ? "Use the camera" : "Utilisez la caméra",
    importPhoto: lang === "en" ? "Import a photo" : "Importer une photo",
    formats: lang === "en" ? "Accepted formats: JPG, PNG" : "Formats acceptés : JPG, PNG",
    cameraPreview: lang === "en" ? "Camera Preview" : "Aperçu Caméra",
    comparison: lang === "en" ? "Face / document comparison" : "Comparaison visage / document",
    detected: lang === "en" ? "Face detected" : "Visage détecté",
    oneface: lang === "en" ? "1 face detected" : "1 visage détecté",
    clearImg: lang === "en" ? "Clear image" : "Image nette",
    accepted: lang === "en" ? "Photo accepted" : "Photo acceptée",
    match: lang === "en" ? "Match with document" : "Correspondance avec le document",
    humanCheck: lang === "en" ? "If in doubt, the request will go through human validation." : "En cas de doute, la demande passera en validation humaine.",
    back: lang === "en" ? "Back" : "Retour",
    continue: lang === "en" ? "Continue" : "Continuer",
  };

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl text-center">{t.title}</CardTitle>
        <p className="text-text-muted mt-2 text-center">{t.subtitle}</p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <button className="flex items-center justify-center gap-4 p-4 min-h-[52px] border border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group bg-white shadow-sm">
            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-primary">{t.takeSelfie}</span>
              <span className="text-xs text-text-muted">{t.useCamera}</span>
            </div>
          </button>
          <button className="flex items-center justify-center gap-4 p-4 min-h-[52px] border border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group bg-white shadow-sm">
            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-primary">{t.importPhoto}</span>
              <span className="text-xs text-text-muted">{t.formats}</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center" style={{ height: "clamp(200px, 28vh, 280px)" }}>
            <div className="w-full h-full bg-slate-300 relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-500">
                <div className="w-32 h-40 bg-slate-400 rounded-[50%] mb-4 opacity-50"></div>
                <p className="font-bold">{t.cameraPreview}</p>
              </div>
            </div>
          </div>

          <div className="border border-border-light rounded-xl p-6 flex flex-col bg-white">
            <h4 className="font-bold text-text-main mb-4">{t.comparison}</h4>
            <div className="bg-success/15 border border-success/30 rounded-xl p-4 flex items-center gap-3 mb-6">
              <span className="font-bold text-success text-lg flex-grow">{t.detected}</span>
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className="flex flex-col gap-4 mb-6 flex-grow">
              <div className="flex items-center gap-3 text-sm text-text-main font-medium"><CheckCircle2 className="w-5 h-5 text-success" /> {t.oneface}</div>
              <div className="flex items-center gap-3 text-sm text-text-main font-medium"><CheckCircle2 className="w-5 h-5 text-success" /> {t.clearImg}</div>
              <div className="flex items-center gap-3 text-sm text-text-main font-medium"><CheckCircle2 className="w-5 h-5 text-success" /> {t.accepted}</div>
              <div className="flex items-center gap-3 text-sm text-text-main font-medium"><CheckCircle2 className="w-5 h-5 text-success" /> {t.match}</div>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg flex gap-3 text-sm text-primary border border-primary/20">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>{t.humanCheck}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border-light mt-8">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button onClick={() => router.push("/borne/nouvelle-sim/offres")} className="px-10">
            {t.continue} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
