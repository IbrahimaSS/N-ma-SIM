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

export default function ScanPiece() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [profile, setProfile] = useState("resident");

  // Type de document sélectionné
  const [docType, setDocType] = useState<DocType>(null);

  // Fichiers capturés
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [rectoPreviewUrl, setRectoPreviewUrl] = useState<string | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [versoPreviewUrl, setVersoPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Caméra
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
    // Si l'utilisateur est étranger, seul le passeport est accepté → présélection auto
    if (savedProfile === "etranger") {
      setDocType("passeport");
    }
  }, []);

  // Nettoyer stream caméra à la fermeture
  useEffect(() => {
    return () => {
      stopCamera();
      if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
      if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = {
    title: lang === "en" ? "Step 1/6 — ID Document Scan" : "Étape 1/6 — Scan de la pièce d'identité",
    subtitle: lang === "en" ? "Scan or import your document to launch AI / OCR analysis." : "Scannez ou importez votre pièce pour lancer l'analyse IA / OCR.",
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
    info: lang === "en" ? "Information will be pre-filled automatically after analysis." : "Les informations seront pré-remplies automatiquement après l'analyse.",
    back: lang === "en" ? "Back" : "Retour",
    extract: lang === "en" ? "Extract information" : "Extraire les informations",
    saving: lang === "en" ? "Saving..." : "Sauvegarde...",
    errorSave: lang === "en" ? "Error saving document. Please try again." : "Erreur lors de la sauvegarde. Veuillez réessayer.",
    changeDoc: lang === "en" ? "Change" : "Changer",
    cameraError: lang === "en" ? "Camera not accessible. Please check permissions." : "Caméra inaccessible. Vérifiez les autorisations.",
    capturingRecto: lang === "en" ? "Capturing: Front (recto)" : "Capture : Recto",
    capturingVerso: lang === "en" ? "Capturing: Back (verso)" : "Capture : Verso",
  };

  // Le verso est obligatoire pour CNI et Passeport
  const needsVerso = docType === "cni" || docType === "passeport";
  const hasRecto = !!rectoFile;
  const hasVerso = !!versoFile;
  // Prêt à continuer : recto obligatoire, verso obligatoire seulement si needsVerso
  const canContinue = hasRecto && (!needsVerso || hasVerso);

  /** Import fichier recto */
  const handleRectoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
    setRectoFile(file);
    setRectoPreviewUrl(URL.createObjectURL(file));
    setSaveError(null);
    e.target.value = "";
  };

  /** Import fichier verso */
  const handleVersoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    setVersoFile(file);
    setVersoPreviewUrl(URL.createObjectURL(file));
    setSaveError(null);
    e.target.value = "";
  };

  /** Ouvrir la caméra pour recto ou verso */
  const openCamera = async (target: CameraTarget) => {
    setCameraError(null);
    setCameraTarget(target);
    setCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError(t.cameraError);
    }
  };

  /** Arrêter la caméra */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraMode(false);
  };

  /** Capturer une photo depuis le flux vidéo */
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      if (cameraTarget === "recto") {
        const file = new File([blob], "recto_capture.jpg", { type: "image/jpeg" });
        if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
        setRectoFile(file);
        setRectoPreviewUrl(URL.createObjectURL(file));
      } else {
        const file = new File([blob], "verso_capture.jpg", { type: "image/jpeg" });
        if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
        setVersoFile(file);
        setVersoPreviewUrl(URL.createObjectURL(file));
      }
      setSaveError(null);
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  /** Changer le type de document → reset les fichiers */
  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl);
    if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    setRectoFile(null);
    setRectoPreviewUrl(null);
    setVersoFile(null);
    setVersoPreviewUrl(null);
    setSaveError(null);
  };

  /** Sauvegarde dans IndexedDB puis navigation */
  const handleContinue = async () => {
    if (!rectoFile) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveKycImage("kyc_recto", rectoFile);
      if (versoFile) await saveKycImage("kyc_verso", versoFile);

      // Sauvegarder le type de document sélectionné par l'utilisateur (source de vérité)
      if (docType) sessionStorage.setItem("kiosk_doc_type", docType);

      // Appel de l'API pour extraire les informations (sans selfie)
      const result = await verifierKYC(rectoFile, null, versoFile ?? undefined, docType ?? undefined);
      await saveKycResult(result);

      router.push("/borne/nouvelle-sim/confirmation-infos");
    } catch {
      setSaveError(t.errorSave);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Composant réutilisable : zone de capture (recto ou verso) ───────────────
  const CaptureZone = ({
    label,
    previewUrl,
    onImport,
    onCamera,
    inputRef,
    onSelect,
  }: {
    label: string;
    previewUrl: string | null;
    onImport: () => void;
    onCamera: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="border border-border-light rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onSelect}
      />
      <h4 className="font-bold text-text-main text-sm">{label}</h4>

      {/* Aperçu */}
      <div className="w-full h-28 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm relative">
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={label} className="w-full h-full object-contain" />
            <button
              onClick={onImport}
              className="absolute top-1 right-1 bg-white border border-border-light rounded-full p-1 shadow hover:bg-gray-50"
              title={t.changeDoc}
            >
              <XCircle className="w-3.5 h-3.5 text-text-muted" />
            </button>
          </>
        ) : (
          <div className="w-[85%] h-[70%] bg-pink-50/50 rounded flex relative border border-pink-100">
            <div className="w-12 h-16 bg-gray-200 rounded absolute left-3 top-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col gap-1.5 absolute left-18 top-4">
              <div className="h-1.5 w-24 bg-gray-300 rounded"></div>
              <div className="h-2 w-32 bg-gray-800 rounded"></div>
              <div className="h-1.5 w-20 bg-gray-300 rounded mt-1"></div>
            </div>
          </div>
        )}
      </div>

      {/* Boutons Import / Caméra */}
      {!previewUrl ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onImport}
            className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <Upload className="w-5 h-5 text-primary mb-1 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-xs font-bold text-primary">{t.importImg}</span>
          </button>
          <button
            onClick={onCamera}
            className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <Camera className="w-5 h-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-primary">{t.takePhoto}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-xs text-success font-semibold">{t.readable}</span>
          <button
            onClick={onImport}
            className="ml-auto text-xs text-primary underline hover:text-primary/70 transition-colors"
          >
            {t.changeDoc}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <p className="text-text-muted mt-2">{t.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent>

        {/* ── 1. Sélection du type de document ── */}
        {profile === "etranger" ? (
          // Étranger : bandeau informatif — Passeport présélectionné automatiquement
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
          // Résident : sélecteur normal
          <div className="mb-5">
            <p className="font-bold text-text-main mb-1">{t.docTypeLabel}</p>
            <p className="text-xs text-text-muted mb-3">{t.docTypeSub}</p>
            <div className="flex gap-3 flex-wrap">
              {(["cni", "passeport", "carte_electeur"] as DocType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleDocTypeChange(type)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                    docType === type
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-main border-border-light hover:border-primary hover:text-primary"
                  }`}
                >
                  {type === "cni" ? t.cni : type === "passeport" ? t.passeport : t.carteElecteur}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. Zones de capture (visibles seulement après sélection du type) ── */}
        {docType && (
          <>
            {/* === MODE CAMÉRA AVEC GUIDE AUTO-CAPTURE === */}
            {cameraMode && (
              <div className="mb-5">
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
              </div>
            )}

            {/* Zones de capture : recto + verso (si besoin) */}
            {!cameraMode && (
              <div className={`grid gap-4 mb-5 ${needsVerso ? "grid-cols-2" : "grid-cols-1"}`}>
                <CaptureZone
                  label={t.previewRecto}
                  previewUrl={rectoPreviewUrl}
                  onImport={() => rectoInputRef.current?.click()}
                  onCamera={() => openCamera("recto")}
                  inputRef={rectoInputRef}
                  onSelect={handleRectoSelect}
                />
                {needsVerso && (
                  <CaptureZone
                    label={t.previewVerso}
                    previewUrl={versoPreviewUrl}
                    onImport={() => versoInputRef.current?.click()}
                    onCamera={() => openCamera("verso")}
                    inputRef={versoInputRef}
                    onSelect={handleVersoSelect}
                  />
                )}
              </div>
            )}

            {/* Statut d'analyse IA */}
            <div className="border border-border-light rounded-xl p-6 flex flex-col mb-5">
              <h4 className="font-bold text-text-main mb-4">{t.aiAnalysis}</h4>
              {canContinue ? (
                <>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    <span className="font-bold text-primary text-lg">{lang === "en" ? "Ready for analysis" : "Prêt pour l'analyse"}</span>
                  </div>
                  <div className="flex flex-col gap-3 flex-grow">
                    <div className="flex items-center gap-3 text-sm text-text-main">
                      <CheckCircle2 className="w-5 h-5 text-success" /> {lang === "en" ? "Photos saved" : "Photos enregistrées"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-text-main">
                      <CheckCircle2 className="w-5 h-5 text-success" /> {lang === "en" ? "Ready for OCR extraction" : "Prêt pour l'extraction OCR"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-sm text-text-muted flex-grow">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.waitingDoc}
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg flex gap-3 text-sm text-text-muted border border-border-light mt-4">
                <Info className="w-5 h-5 text-primary flex-shrink-0" />
                <p>{t.info}</p>
              </div>
            </div>
          </>
        )}

        {/* Message d'erreur */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {saveError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue || isSaving}
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t.saving}</>
            ) : (
              <>{t.extract} <ChevronRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
