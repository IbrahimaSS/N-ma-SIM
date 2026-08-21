"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Camera, Upload, CheckCircle2, Info, ChevronRight, ArrowLeft, XCircle, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { CameraCapture } from "@/components/borne/CameraCapture";
import { verifierKYC } from "@/lib/kyc.client";
import { getKycImage, saveKycImage, saveKycResult } from "@/lib/kyc.storage";
import type { KycReponse, KycError } from "@/types/kyc";

export default function VerificationSelfie() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kycResult, setKycResult] = useState<KycReponse | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLang(sessionStorage.getItem("kiosk_lang") || "fr"); }, []);
  useEffect(() => { return () => { if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl); }; }, [selfiePreviewUrl]);

  const t = {
    title: lang === "en" ? "Step 2/2 — Selfie" : "Étape 2/2 — Selfie",
    subtitle: lang === "en" ? "Take a selfie to compare with your document." : "Prenez un selfie pour comparer avec votre pièce.",
    takeSelfie: lang === "en" ? "Take a selfie" : "Prendre un selfie",
    useCamera: lang === "en" ? "Use the camera" : "Utilisez la caméra",
    importPhoto: lang === "en" ? "Import a photo" : "Importer une photo",
    formats: lang === "en" ? "Accepted: JPG, PNG" : "Formats : JPG, PNG",
    comparison: lang === "en" ? "Verification result" : "Résultat de vérification",
    noRecto: lang === "en" ? "No document found. Go back and scan your ID." : "Aucune pièce trouvée. Revenez et scannez votre pièce.",
    similarity: lang === "en" ? "Face similarity" : "Similarité faciale",
    back: lang === "en" ? "Back" : "Retour",
    verify: lang === "en" ? "Verify" : "Vérifier",
    analyzing: lang === "en" ? "Verifying..." : "Vérification en cours...",
    errorKyc: lang === "en" ? "Verification error" : "Erreur de vérification",
    changeSelfie: lang === "en" ? "Change photo" : "Changer la photo",
    waitingSelfie: lang === "en" ? "Waiting for selfie..." : "En attente du selfie...",
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    setSelfieFile(file); setSelfiePreviewUrl(URL.createObjectURL(file)); setKycResult(null); setKycError(null);
  };

  const handleVerify = async () => {
    if (!selfieFile) return;
    setIsAnalyzing(true); setKycError(null);
    try {
      const recto = await getKycImage("kyc_recto");
      if (!recto) { setKycError(t.noRecto); return; }
      const verso = await getKycImage("kyc_verso");
      await saveKycImage("kyc_selfie", selfieFile);
      const docType = sessionStorage.getItem("kiosk_doc_type") || undefined;
      const result = await verifierKYC(recto, selfieFile, verso ?? undefined, docType);
      setKycResult(result);
      await saveKycResult(result);
      // Naviguer vers la page résultat
      router.push("/borne/verification/resultat");
    } catch (err) {
      const kycErr = err as KycError;
      setKycError(kycErr.message || "Erreur inconnue.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasSelfie = !!selfieFile;

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <input ref={selfieInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={handleFileSelect} />
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl text-center">{t.title}</CardTitle>
        <p className="text-text-muted mt-2 text-center">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        {!hasSelfie && !cameraMode && (
          <div className="grid grid-cols-2 gap-4 mb-5">
            <button onClick={() => setCameraMode(true)} className="flex items-center justify-center gap-4 p-4 min-h-[52px] border border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group bg-white shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform"><Camera className="w-6 h-6" /></div>
              <div className="flex flex-col items-start"><span className="font-bold text-primary">{t.takeSelfie}</span><span className="text-xs text-text-muted">{t.useCamera}</span></div>
            </button>
            <button onClick={() => selfieInputRef.current?.click()} className="flex items-center justify-center gap-4 p-4 min-h-[52px] border border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group bg-white shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform"><Upload className="w-6 h-6" /></div>
              <div className="flex flex-col items-start"><span className="font-bold text-primary">{t.importPhoto}</span><span className="text-xs text-text-muted">{t.formats}</span></div>
            </button>
          </div>
        )}
        {cameraMode && (
          <div className="mb-5">
            <CameraCapture mode="selfie" label={t.takeSelfie}
              onCapture={(file) => { if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl); setSelfieFile(file); setSelfiePreviewUrl(URL.createObjectURL(file)); setKycResult(null); setKycError(null); setCameraMode(false); }}
              onCancel={() => setCameraMode(false)}
            />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center relative" style={{ height: "clamp(200px, 28vh, 280px)" }}>
            {selfiePreviewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selfiePreviewUrl} alt="Selfie" className="w-full h-full object-cover" />
                <button onClick={() => selfieInputRef.current?.click()} className="absolute top-2 right-2 bg-white border border-border-light rounded-full p-1 shadow" title={t.changeSelfie}>
                  <XCircle className="w-4 h-4 text-text-muted" />
                </button>
              </>
            ) : (
              <div className="w-full h-full bg-slate-300 flex items-center justify-center flex-col text-slate-500">
                <div className="w-32 h-40 bg-slate-400 rounded-[50%] mb-4 opacity-50"></div>
                <p className="font-bold">Selfie</p>
              </div>
            )}
          </div>
          <div className="border border-border-light rounded-xl p-6 flex flex-col bg-white">
            <h4 className="font-bold text-text-main mb-4">{t.comparison}</h4>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center flex-grow gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-primary font-semibold text-sm">{t.analyzing}</p>
              </div>
            ) : hasSelfie ? (
              <div className="flex flex-col gap-3 flex-grow">
                <div className="bg-success/15 border border-success/30 rounded-xl p-4 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-success" />
                  <span className="font-bold text-success">{lang === "en" ? "Ready for verification" : "Prêt pour la vérification"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-5 h-5 text-success" /> {lang === "en" ? "Selfie captured" : "Selfie capturé"}</div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-text-muted flex-grow">
                <Loader2 className="w-5 h-5" /> {t.waitingSelfie}
              </div>
            )}
            <div className="bg-primary/5 p-4 rounded-lg flex gap-3 text-sm text-primary border border-primary/20 mt-auto">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>{lang === "en" ? "Your identity will be verified securely." : "Votre identité sera vérifiée de façon sécurisée."}</p>
            </div>
          </div>
        </div>
        {kycError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div><p className="font-bold mb-1">{t.errorKyc}</p><p>{kycError}</p></div>
          </div>
        )}
        <div className="flex justify-between items-center pt-4 border-t border-border-light mt-4">
          <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-5 h-5 mr-2" /> {t.back}</Button>
          <Button onClick={handleVerify} disabled={!hasSelfie || isAnalyzing} className="px-10">
            {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t.analyzing}</> : <>{t.verify} <ChevronRight className="w-5 h-5 ml-2" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
