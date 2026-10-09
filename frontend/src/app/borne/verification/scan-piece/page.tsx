"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Camera, CheckCircle2, Info, ChevronRight, ArrowLeft, XCircle, Loader2, ScanLine, AlertTriangle } from "lucide-react";
import { CameraCapture } from "@/components/borne/CameraCapture";
import { ExtractionOverlay } from "@/components/borne/ExtractionOverlay";
import { saveKycImage, saveKycResult } from "@/lib/kyc.storage";
import { verifierKYC } from "@/lib/kyc.client";
import { scannerViaImprimante } from "@/lib/materiel/scanner.client";
import { recadrerPiece, type StatutRecadrage } from "@/lib/kyc.recadrage";
import { useLancementAuto, useSelectionFichier } from "@/lib/useLancementAuto";

type DocType = "cni" | "passeport" | "carte_electeur" | "permis" | null;
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
  const [scanningTarget, setScanningTarget] = useState<CameraTarget | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  // Recadrage automatique de la pièce (zoom sur la carte, sans déformation)
  const [recadrageEnCours, setRecadrageEnCours] = useState<CameraTarget | null>(null);
  const [statuts, setStatuts] = useState<Partial<Record<CameraTarget, StatutRecadrage>>>({});
  // Fenêtre de choix de fichier ouverte : le lancement automatique attend
  const selection = useSelectionFichier();
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
    scanPrinter: lang === "en" ? "Scan" : "Scanner",
    scanning: lang === "en" ? "Scanning..." : "Scan...",
    scanErrorPrefix: lang === "en" ? "Scan error" : "Erreur de scan",
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
    cropping: lang === "en" ? "Framing the document..." : "Cadrage de la pièce...",
    notFound: lang === "en" ? "No document detected" : "Aucune pièce détectée",
    notFoundHelp: lang === "en"
      ? "We could not find your document in the image. Place it flat and fully visible, then press « Change » to take the picture again."
      : "Nous ne trouvons pas votre pièce sur l'image. Posez-la bien à plat et entièrement visible, puis appuyez sur « Changer » pour la reprendre.",
    cancelAuto: lang === "en" ? "Cancel automatic start" : "Annuler le lancement automatique",
    autoLaunch: (s: number) => lang === "en" ? `Analysis starts automatically in ${s} s...` : `L'analyse démarre automatiquement dans ${s} s...`,
  };

  const needsVerso = docType === "cni" || docType === "passeport" || docType === "permis";
  const canContinue = !!rectoFile && (!needsVerso || !!versoFile);
  // Une face où aucune pièce n'a été détectée bloque le lancement automatique
  const pieceIntrouvable = statuts.recto === "introuvable" || (needsVerso && statuts.verso === "introuvable");

  /** Toute image (import, caméra, scanner) passe par ici : recadrage sur la pièce puis aperçu */
  const definirImage = async (target: CameraTarget, brut: File) => {
    setRecadrageEnCours(target);
    const { file, statut } = await recadrerPiece(brut);
    if (target === "recto") { if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl); setRectoFile(file); setRectoPreviewUrl(URL.createObjectURL(file)); }
    else { if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl); setVersoFile(file); setVersoPreviewUrl(URL.createObjectURL(file)); }
    setStatuts((s) => ({ ...s, [target]: statut }));
    setSaveError(null);
    setRecadrageEnCours(null);
  };

  const handleRectoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    selection.fermer();
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = ""; definirImage("recto", file);
  };
  const handleVersoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    selection.fermer();
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = ""; definirImage("verso", file);
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCameraMode(false); };
  const handleScan = async (target: CameraTarget) => {
    setScanError(null); setScanningTarget(target);
    try {
      const file = await scannerViaImprimante(`${target}_scan.jpg`);
      await definirImage(target, file);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Erreur de scan.");
    } finally {
      setScanningTarget(null);
    }
  };
  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    if (rectoPreviewUrl) URL.revokeObjectURL(rectoPreviewUrl); if (versoPreviewUrl) URL.revokeObjectURL(versoPreviewUrl);
    setRectoFile(null); setRectoPreviewUrl(null); setVersoFile(null); setVersoPreviewUrl(null); setStatuts({}); setSaveError(null);
  };

  const handleContinue = async () => {
    if (!rectoFile || isSaving) return;
    setIsSaving(true); setSaveError(null);
    try {
      await saveKycImage("kyc_recto", rectoFile);
      if (versoFile) await saveKycImage("kyc_verso", versoFile);
      // Pré-analyse OCR sans selfie — le selfie sera capturé à l'étape suivante
      const result = await verifierKYC(rectoFile, null, versoFile ?? undefined, docType ?? undefined);
      await saveKycResult(result);
      sessionStorage.setItem("kiosk_verif_scan_ok", "1");
      router.push("/borne/verification/selfie");
    } catch {
      setSaveError(t.errorSave);
    } finally {
      setIsSaving(false);
    }
  };

  // Extraction lancée toute seule 5 s après que toutes les faces requises sont prêtes
  const { restant: lancementDans, annuler: annulerLancement } = useLancementAuto(
    canContinue ? `${docType}|${rectoPreviewUrl}|${needsVerso ? versoPreviewUrl : ""}` : null,
    canContinue && !cameraMode && !recadrageEnCours && !scanningTarget && !pieceIntrouvable && !selection.ouverte,
    isSaving,
    handleContinue,
  );

  const CaptureZone = ({ label, previewUrl, onImport, onCamera, onScan, isScanning, isProcessing, statut }: {
    label: string; previewUrl: string | null;
    onImport: () => void; onCamera: () => void;
    onScan: () => void; isScanning: boolean;
    isProcessing: boolean; statut?: StatutRecadrage;
  }) => (
    <div className="border border-border-light rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
      <h4 className="font-bold text-text-main text-sm">{label}</h4>
      {/* Aperçu : la pièce recadrée est zoomée dans le cadre, sans déformation */}
      <div className="w-full h-36 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm relative">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 text-primary">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-semibold">{t.cropping}</span>
          </div>
        ) : previewUrl ? (
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
      {isProcessing ? null : !previewUrl ? (
        <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto w-full">
          <button onClick={onCamera} className="flex flex-col items-center justify-center py-2 px-3 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group">
            <Camera className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs font-bold text-primary">{t.takePhoto}</span>
          </button>
          <button onClick={onScan} disabled={isScanning} className="flex flex-col items-center justify-center py-2 px-3 border-2 border-dashed border-border-light rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group disabled:opacity-60 disabled:cursor-wait">
            {isScanning ? <Loader2 className="w-5 h-5 text-primary mb-1 animate-spin" /> : <ScanLine className="w-5 h-5 text-primary mb-1" />}
            <span className="text-xs font-bold text-primary">{isScanning ? t.scanning : t.scanPrinter}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {statut === "introuvable" ? (
            <><AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" /><span className="text-xs text-warning font-semibold">{t.notFound}</span></>
          ) : (
            <><CheckCircle2 className="w-4 h-4 text-success" /><span className="text-xs text-success font-semibold">{t.readable}</span></>
          )}
          <button onClick={onImport} className="ml-auto text-xs text-primary underline">{t.changeDoc}</button>
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <ExtractionOverlay visible={isSaving} lang={lang} />
      {/* Champs fichier au niveau de la page (et non dans CaptureZone, recréée à chaque rendu) :
          sinon le champ qui a ouvert la fenêtre de choix est remplacé pendant le décompte et
          le fichier choisi est perdu. */}
      <input ref={rectoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleRectoSelect} />
      <input ref={versoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleVersoSelect} />
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
              {(["cni", "passeport", "carte_electeur", "permis"] as DocType[]).map((type) => (
                <button key={type} onClick={() => handleDocTypeChange(type)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${docType === type ? "bg-primary text-white border-primary" : "bg-white text-text-main border-border-light hover:border-primary hover:text-primary"}`}>
                  {type === "cni" ? "CNI" : type === "passeport" ? (lang === "en" ? "Passport" : "Passeport") : type === "carte_electeur" ? (lang === "en" ? "Voter ID" : "Carte d'électeur") : (lang === "en" ? "Biometric Licence" : "Permis Biométrique")}
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
                  onCapture={(file) => { setCameraMode(false); definirImage(cameraTarget, file); }}
                  onCancel={stopCamera}
                />
              </div>
            )}
            {!cameraMode && (
              <div className={`grid gap-4 mb-5 ${needsVerso ? "grid-cols-2" : "grid-cols-1 max-w-md mx-auto w-full"}`}>
                <CaptureZone label={t.previewRecto} previewUrl={rectoPreviewUrl} onImport={() => selection.ouvrir(rectoInputRef)} onCamera={() => { setCameraTarget("recto"); setCameraMode(true); }} onScan={() => handleScan("recto")} isScanning={scanningTarget === "recto"} isProcessing={recadrageEnCours === "recto"} statut={statuts.recto} />
                {needsVerso && <CaptureZone label={t.previewVerso} previewUrl={versoPreviewUrl} onImport={() => selection.ouvrir(versoInputRef)} onCamera={() => { setCameraTarget("verso"); setCameraMode(true); }} onScan={() => handleScan("verso")} isScanning={scanningTarget === "verso"} isProcessing={recadrageEnCours === "verso"} statut={statuts.verso} />}
              </div>
            )}
            <div className="border border-border-light rounded-xl p-5 mb-5">
              <h4 className="font-bold text-text-main mb-3">{t.aiAnalysis}</h4>
              {canContinue && pieceIntrouvable ? (
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-700">{t.notFound}</p>
                    <p className="text-sm text-amber-700/90 mt-1">{t.notFoundHelp}</p>
                  </div>
                </div>
              ) : canContinue ? (
                <>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    <span className="font-bold text-primary">{lang === "en" ? "Ready for analysis" : "Prêt pour l'analyse"}</span>
                  </div>
                  {lancementDans !== null && (
                    <div className="flex items-center gap-2 text-sm text-primary font-semibold mt-3">
                      <Loader2 className="w-4 h-4 animate-spin" /> <span className="animate-pulse">{t.autoLaunch(lancementDans)}</span>
                <button type="button" onClick={annulerLancement} className="ml-auto text-xs font-semibold text-text-muted underline hover:text-primary">{t.cancelAuto}</button>
                    </div>
                  )}
                </>
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

        {scanError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" /> <span><strong>{t.scanErrorPrefix} :</strong> {scanError}</span>
          </div>
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
