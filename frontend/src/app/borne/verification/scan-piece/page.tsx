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

type DocType = "cni" | "passeport" | "carte_electeur" | null;
type CameraTarget = "recto" | "verso";

export default function VerificationScanPiece() {
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
  const streamRef = useRef<MediaStream | null>(null);
  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLang = sessionStorage.getItem("kiosk_lang") || "fr";
    const savedProfile = sessionStorage.getItem("kiosk_profile") || "resident";
    setLang(savedLang);
    setProfile(savedProfile);
    if (savedProfile === "etranger") {
      setDocType("passeport");
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = {
    title: lang === "en" ? "Step 1/2 — ID Document Scan" : "Étape 1/2 — Scan de la pièce d'identité",
    subtitle: lang === "en" ? "Scan your ID to verify your information." : "Scannez votre pièce pour vérifier vos informations.",
    docTypeLabel: lang === "en" ? "Document type" : "Type de pièce",
    docTypeSub: lang === "en" ? "Select your document type" : "Sélectionnez votre type de pièce",
    importImg: lang === "en" ? "Import" : "Importer",
    takePhoto: lang === "en" ? "Camera" : "Caméra",
    previewRecto: lang === "en" ? "Front (recto)" : "Recto",
    previewVerso: lang === "en" ? "Back (verso)" : "Verso",
    aiAnalysis: lang === "en" ? "AI Analysis" : "Analyse IA",
    readable: lang === "en" ? "Document ready" : "Document prêt",
    waitingDoc: lang === "en" ? "Waiting for document..." : "En attente du document...",
    info: lang === "en" ? "Your document will be analysed securely." : "Votre pièce sera analysée de façon sécurisée.",
    back: lang === "en" ? "Back" : "Retour",
    extract: lang === "en" ? "Continue to selfie" : "Continuer vers le selfie",
    saving: lang === "en" ? "Analysing..." : "Analyse en cours...",
    errorSave: lang === "en" ? "Error. Please try again." : "Erreur. Veuillez réessayer.",
    changeDoc: lang === "en" ? "Change" : "Changer",
    cameraError: lang === "en" ? "Camera not accessible." : "Caméra inaccessible.",
    capturingRecto: lang === "en" ? "Capturing: Front" : "Capture : Recto",
    capturingVerso: lang === "en" ? "Capturing: Back" : "Capture : Verso",
  };

  const needsVerso = docType === "cni" || docType === "passeport";
  const canContinue = !!rectoFile && (!needsVerso || !!versoFile);

  const handleRectoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
    setRectoFile(file); setRectoPreviewUrl(URL.createObjectURL(file)); setSaveError(null); e.target.value = "";
  };
  const handleVersoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    setVersoFile(file); setVersoPreviewUrl(URL.createObjectURL(file)); setSaveError(null); e.target.value = "";
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCameraMode(false); };
  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl); if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    setRectoFile(null); setRectoPreviewUrl(null); setVersoFile(null); setVersoPreviewUrl(null); setSaveError(null);
  };

  const handleContinue = async () => {
    if (!rectoFile) return;
    setIsSaving(true); setSaveError(null);
    try {
      await saveKycImage("kyc_recto", rectoFile);
      if (versoFile) await saveKycImage("kyc_verso", versoFile);
      // Pré-analyse OCR sans selfie — le selfie sera capturé à l'étape suivante
      const result = await verifierKYC(rectoFile, null, versoFile ?? undefined);
      await saveKycResult(result);
      router.push("/borne/verification/selfie");
    } catch {
      setSaveError(t.errorSave);
    } finally {
      setIsSaving(false);
    }
  };

  const CaptureZone = ({ label, previewUrl, onImport, onCamera, inputRef, onSelect }: {
    label: string; previewUrl: string | null;
    onImport: () => void; onCamera: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="border border-border-light rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onSelect} />
      <h4 className="font-bold text-text-main text-sm">{label}</h4>
      <div className="w-full h-28 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm relative">
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={label} className="w-full h-full object-contain" />
            <button onClick={onImport} className="absolute top-1 right-1 bg-white border border-border-light rounded-full p-1 shadow hover:bg-gray-50">
              <XCircle className="w-3.5 h-3.5 text-text-muted" />
            </button>
          </>
        ) : (
          <div className="w-[85%] h-[70%] bg-pink-50/50 rounded flex relative border border-pink-100">
            <div className="w-12 h-16 bg-gray-200 rounded absolute left-3 top-1/2 -translate-y-1/2"></div>
          </div>
        )}
      </div>
      {!previewUrl ? (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onImport} className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group">
            <Upload className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs font-bold text-primary">{t.importImg}</span>
          </button>
          <button onClick={onCamera} className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group">
            <Camera className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs font-bold text-primary">{t.takePhoto}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-xs text-success font-semibold">{t.readable}</span>
          <button onClick={onImport} className="ml-auto text-xs text-primary underline">{t.changeDoc}</button>
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <CardHeader><CardTitle className="text-2xl">{t.title}</CardTitle><p className="text-text-muted mt-2">{t.subtitle}</p></CardHeader>
      <CardContent>
        {/* Type de document */}
        {profile === "etranger" ? (
          <div className="mb-5 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <span style={{ fontSize: 22 }}>🌍</span>
            <div>
              <p className="font-bold text-blue-800 text-sm mb-0.5">
                {lang === "en" ? "Foreign national profile" : "Profil Étranger"}
              </p>
              <p className="text-xs text-blue-700">
                {lang === "en"
                  ? "For foreigners, only a Passport is accepted as valid identification."
                  : "Pour les étrangers, seul le Passeport est accepté comme pièce d'identité valide."}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                <span>🛂</span>
                {lang === "en" ? "Passport" : "Passeport"}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <p className="font-bold text-text-main mb-1">{t.docTypeLabel}</p>
            <p className="text-xs text-text-muted mb-3">{t.docTypeSub}</p>
            <div className="flex gap-3 flex-wrap">
              {(["cni", "passeport", "carte_electeur"] as DocType[]).map((type) => (
                <button key={type} onClick={() => handleDocTypeChange(type)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${docType === type ? "bg-primary text-white border-primary" : "bg-white text-text-main border-border-light hover:border-primary hover:text-primary"}`}>
                  {type === "cni" ? "CNI" : type === "passeport" ? (lang === "en" ? "Passport" : "Passeport") : (lang === "en" ? "Voter ID" : "Carte d'électeur")}
                </button>
              ))}
            </div>
          </div>
        )}

        {docType && (
          <>
            {cameraMode && (
              <div className="mb-5">
                <CameraCapture mode="document" label={cameraTarget === "recto" ? t.capturingRecto : t.capturingVerso}
                  onCapture={(file) => {
                    if (cameraTarget === "recto") { if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl); setRectoFile(file); setRectoPreviewUrl(URL.createObjectURL(file)); }
                    else { if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl); setVersoFile(file); setVersoPreviewUrl(URL.createObjectURL(file)); }
                    setSaveError(null); setCameraMode(false);
                  }}
                  onCancel={stopCamera}
                />
              </div>
            )}
            {!cameraMode && (
              <div className={`grid gap-4 mb-5 ${needsVerso ? "grid-cols-2" : "grid-cols-1"}`}>
                <CaptureZone label={t.previewRecto} previewUrl={rectoPreviewUrl} onImport={() => rectoInputRef.current?.click()} onCamera={() => { setCameraTarget("recto"); setCameraMode(true); }} inputRef={rectoInputRef} onSelect={handleRectoSelect} />
                {needsVerso && <CaptureZone label={t.previewVerso} previewUrl={versoPreviewUrl} onImport={() => versoInputRef.current?.click()} onCamera={() => { setCameraTarget("verso"); setCameraMode(true); }} inputRef={versoInputRef} onSelect={handleVersoSelect} />}
              </div>
            )}
            <div className="border border-border-light rounded-xl p-5 mb-5">
              <h4 className="font-bold text-text-main mb-3">{t.aiAnalysis}</h4>
              {canContinue ? (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <span className="font-bold text-primary">{lang === "en" ? "Ready for analysis" : "Prêt pour l'analyse"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin" /> {t.waitingDoc}
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg flex gap-3 text-sm text-text-muted border border-border-light mt-4">
                <Info className="w-5 h-5 text-primary flex-shrink-0" /><p>{t.info}</p>
              </div>
            </div>
          </>
        )}

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
          </div>
        )}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-5 h-5 mr-2" /> {t.back}</Button>
          <Button onClick={handleContinue} disabled={!canContinue || isSaving}>
            {isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t.saving}</> : <>{t.extract} <ChevronRight className="w-5 h-5 ml-2" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
