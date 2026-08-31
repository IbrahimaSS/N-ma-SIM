"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Camera, CheckCircle2, Info, ChevronRight, ArrowLeft, XCircle, Loader2 } from "lucide-react";
import { CameraCapture } from "@/components/borne/CameraCapture";
import { saveKycImage, saveKycResult } from "@/lib/kyc.storage";
import { verifierKYC } from "@/lib/kyc.client";
import { jouerSoussou } from "@/lib/soussou-audio";

// Helper pour déclencher l'audio Soussou uniquement
function direInstructions(lang: string, type: "recto" | "verso", service: "nouvelle-sim" | "reactivation") {
  if (lang === "sus") {
    // Dans le dossier, la réactivation utilise "piece-identite-recto"
    jouerSoussou(type === "recto" ? "piece-identite-recto" : "piece-identite-verso", service);
  }
}

type DocType = "cni" | "passeport" | "carte_electeur" | null;
type CameraTarget = "recto" | "verso";

export default function ReactivationPieceIdentite() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [profile, setProfile] = useState("resident");
  const [docType, setDocType] = useState<DocType>(null);
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [rectoPreviewUrl, setRectoPreviewUrl] = useState<string | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [versoPreviewUrl, setVersoPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>("recto");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLang = sessionStorage.getItem("kiosk_lang") || "fr";
    const savedProfile = sessionStorage.getItem("kiosk_profile") || "resident";
    setLang(savedLang);
    setProfile(savedProfile);
    if (savedProfile === "etranger") setDocType("passeport");
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
      if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = {
    title: lang === "en" ? "SIM Reactivation — ID Document" : "Réactivation — Pièce d'identité",
    subtitle: lang === "en" ? "Scan or import your document for AI / OCR analysis." : "Scannez ou importez votre pièce pour l'analyse IA / OCR.",
    docTypeLabel: lang === "en" ? "Document type" : "Type de pièce",
    docTypeSub: lang === "en" ? "Select your document type to continue" : "Sélectionnez votre type de pièce pour continuer",
    cni: "CNI",
    passeport: lang === "en" ? "Passport" : "Passeport",
    carteElecteur: lang === "en" ? "Voter ID" : "Carte d'électeur",
    importImg: lang === "en" ? "Import an image" : "Importer une image",
    importSub: lang === "en" ? "Upload a file (JPG, PNG)" : "Téléchargez un fichier (JPG, PNG)",
    takePhoto: lang === "en" ? "Take a photo" : "Prendre une photo",
    takeSub: lang === "en" ? "Use your camera" : "Utilisez votre caméra",
    capture: lang === "en" ? "Capture" : "Capturer",
    cancelCamera: lang === "en" ? "Cancel" : "Annuler",
    previewRecto: lang === "en" ? "Front (recto)" : "Recto (face avant)",
    previewVerso: lang === "en" ? "Back (verso)" : "Verso (face arrière)",
    aiAnalysis: lang === "en" ? "AI / OCR Analysis" : "Analyse IA / OCR",
    readable: lang === "en" ? "Document ready" : "Document prêt",
    waitingDoc: lang === "en" ? "Waiting for document..." : "En attente du document...",
    detected: lang === "en" ? "Document detected" : "Document détecté",
    clear: lang === "en" ? "Clear image" : "Image nette",
    legible: lang === "en" ? "Legible text" : "Texte lisible",
    info: lang === "en" ? "Information will be extracted for identity verification." : "Les informations seront extraites pour la vérification d'identité.",
    back: lang === "en" ? "Back" : "Retour",
    extract: lang === "en" ? "Extract information" : "Extraire les informations",
    saving: lang === "en" ? "Analysing..." : "Analyse en cours...",
    errorSave: lang === "en" ? "Error analysing document. Please try again." : "Erreur lors de l'analyse. Veuillez réessayer.",
    changeDoc: lang === "en" ? "Change" : "Changer",
    cameraError: lang === "en" ? "Camera not accessible." : "Caméra inaccessible. Vérifiez les autorisations.",
    capturingRecto: lang === "en" ? "Capturing: Front (recto)" : "Capture : Recto",
    capturingVerso: lang === "en" ? "Capturing: Back (verso)" : "Capture : Verso",
  };

  const needsVerso = docType === "cni" || docType === "passeport";
  const hasRecto = !!rectoFile;
  const hasVerso = !!versoFile;
  const canContinue = hasRecto && (!needsVerso || hasVerso);

  const handleRectoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
    setRectoFile(file); setRectoPreviewUrl(URL.createObjectURL(file)); setSaveError(null); e.target.value = "";
  };

  const handleVersoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    setVersoFile(file); setVersoPreviewUrl(URL.createObjectURL(file)); setSaveError(null); e.target.value = "";
  };

  const openCamera = async (target: CameraTarget) => {
    setCameraError(null); setCameraTarget(target); setCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch { setCameraError(t.cameraError); }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCameraMode(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      if (cameraTarget === "recto") { 
        const file = new File([blob], "recto_capture.jpg", { type: "image/jpeg" }); 
        if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl); 
        setRectoFile(file); 
        setRectoPreviewUrl(URL.createObjectURL(file)); 
        // Demander le verso si nécessaire
        if (docType === "cni" || docType === "passeport") {
          setTimeout(() => direInstructions(lang, "verso", "reactivation"), 500);
        }
      } else { 
        const file = new File([blob], "verso_capture.jpg", { type: "image/jpeg" }); 
        if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl); 
        setVersoFile(file); 
        setVersoPreviewUrl(URL.createObjectURL(file)); 
      }
      setSaveError(null); stopCamera();
    }, "image/jpeg", 0.92);
  };

  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
    if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    setRectoFile(null); setRectoPreviewUrl(null); setVersoFile(null); setVersoPreviewUrl(null); setSaveError(null);
    direInstructions(lang, "recto", "reactivation");
  };

  const handleContinue = async () => {
    if (!rectoFile) return;
    setIsSaving(true); setSaveError(null);
    try {
      await saveKycImage("kyc_recto", rectoFile);
      if (versoFile) await saveKycImage("kyc_verso", versoFile);
      if (docType) sessionStorage.setItem("kiosk_doc_type", docType);
      // Appel KYC — extraction pièce uniquement (sans selfie à ce stade)
      // On NE sauvegarde PAS le résultat ici pour ne pas écraser celui du selfie.
      // On stocke seulement les champs extraits pour pré-remplissage.
      const result = await verifierKYC(rectoFile, null, versoFile ?? undefined, docType ?? undefined);
      if (result.champs) {
        sessionStorage.setItem("kyc_champs", JSON.stringify(result.champs));
      }
      // → Aller au selfie de réactivation
      router.push("/borne/reactivation/selfie");
    } catch {
      setSaveError(t.errorSave);
    } finally {
      setIsSaving(false);
    }
  };

  const CaptureZone = ({ label, previewUrl, onImport, onCamera, inputRef, onSelect }: {
    label: string; previewUrl: string | null; onImport: () => void; onCamera: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>; onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="border border-border-light rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onSelect} />
      <h4 className="font-bold text-text-main text-sm">{label}</h4>
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt={label} className="w-full h-40 object-cover rounded-lg border border-success/30" />
          <div className="absolute top-2 right-2 bg-success/10 rounded-full p-1"><CheckCircle2 className="w-5 h-5 text-success" /></div>
          <button onClick={() => onImport()} className="mt-2 text-xs text-primary underline">{t.changeDoc}</button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onImport} className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-primary" /><span className="text-sm font-semibold text-text-main">{t.importImg}</span><span className="text-xs text-text-muted">{t.importSub}</span>
          </button>
          <button onClick={onCamera} className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <Camera className="w-6 h-6 text-primary" /><span className="text-sm font-semibold text-text-main">{t.takePhoto}</span><span className="text-xs text-text-muted">{t.takeSub}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        {cameraMode ? (
          <CameraCapture 
            mode="document" 
            label={cameraTarget === "recto" ? t.capturingRecto : t.capturingVerso}
            onCapture={(file) => {
              if (cameraTarget === "recto") {
                if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
                setRectoFile(file);
                setRectoPreviewUrl(URL.createObjectURL(file));
              } else {
                if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
                setVersoFile(file);
                setVersoPreviewUrl(URL.createObjectURL(file));
              }
              setSaveError(null);
              setCameraMode(false);
            }}
            onCancel={stopCamera} 
          />
        ) : (
          <>
            {/* Choix du type de document */}
            {profile !== "etranger" && (
              <div className="mb-6">
                <p className="font-semibold text-text-main mb-1">{t.docTypeLabel}</p>
                <p className="text-sm text-text-muted mb-3">{t.docTypeSub}</p>
                <div className="flex gap-3 flex-wrap">
                  {(["cni", "passeport", "carte_electeur"] as DocType[]).map((type) => (
                    <button key={type}
                      data-ai-action={type === "cni" ? "btn-cni" : type === "passeport" ? "btn-passeport" : "btn-electeur"}
                      onClick={() => handleDocTypeChange(type)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${docType === type ? "border-primary bg-primary/10 text-primary" : "border-border-light text-text-muted hover:border-primary/50"}`}>
                      {type === "cni" ? t.cni : type === "passeport" ? t.passeport : t.carteElecteur}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {docType && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <CaptureZone label={t.previewRecto} previewUrl={rectoPreviewUrl}
                  onImport={() => rectoInputRef.current?.click()} onCamera={() => openCamera("recto")}
                  inputRef={rectoInputRef} onSelect={handleRectoSelect} />
                {needsVerso && (
                  <CaptureZone label={t.previewVerso} previewUrl={versoPreviewUrl}
                    onImport={() => versoInputRef.current?.click()} onCamera={() => openCamera("verso")}
                    inputRef={versoInputRef} onSelect={handleVersoSelect} />
                )}
              </div>
            )}

            {/* Panneau IA */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary text-sm">{t.aiAnalysis}</p>
                <p className="text-xs text-text-muted mt-0.5">{t.info}</p>
                <div className="flex gap-4 mt-2">
                  {[t.detected, t.clear, t.legible].map((label, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-xs ${hasRecto ? "text-success" : "text-text-muted"}`}>
                      {hasRecto ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-text-muted/40" />}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />{saveError}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border-light">
              <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-5 h-5 mr-2" /> {t.back}</Button>
              <Button onClick={handleContinue} disabled={!canContinue || isSaving} className="px-8">
                {isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.saving}</>) : (<>{t.extract} <ChevronRight className="w-5 h-5 ml-2" /></>)}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
