"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Info, ChevronRight, ArrowLeft, FileText, User as UserIcon, Clock, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { getKycResult } from "@/lib/kyc.storage";
import type { KycReponse } from "@/types/kyc";

export default function ConfirmationInfos() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [profile, setProfile] = useState("resident");

  // Résultat KYC
  const [kycResult, setKycResult] = useState<KycReponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Champs du formulaire (pré-remplis par l'IA, éditables)
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [dateExpiration, setDateExpiration] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [typePiece, setTypePiece] = useState("cni");
  const [numeroPiece, setNumeroPiece] = useState("");


  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    setProfile(sessionStorage.getItem("kiosk_profile") || "resident");

    // Charger le résultat KYC depuis IndexedDB
    getKycResult().then((result) => {
      if (result) {
        setKycResult(result);
        const c = result.champs ?? {};

        // ⚠️ Le backend Python renvoie des clés snake_case
        setNom(c.nom ?? "");
        setPrenom(c.prenom ?? "");
        // date_naissance au format "JJ/MM/AAAA" → converti en YYYY-MM-DD pour <input type="date">
        const raw = c.date_naissance ?? "";
        if (raw && raw.includes("/")) {
          const [jj, mm, aaaa] = raw.split("/");
          setDateNaissance(`${aaaa}-${mm}-${jj}`);
        } else {
          setDateNaissance(raw);
        }
        // date_expiration au format "JJ/MM/AAAA" → YYYY-MM-DD
        const rawExp = c.date_expiration ?? "";
        if (rawExp && rawExp.includes("/")) {
          const [jj, mm, aaaa] = rawExp.split("/");
          setDateExpiration(`${aaaa}-${mm}-${jj}`);
        } else {
          setDateExpiration(rawExp);
        }
        // Adresse : lieu_naissance ou quartier selon le type de pièce
        setAdresse(c.adresse ?? c.quartier ?? c.lieu_naissance ?? "");

        // Type de pièce : la sélection de l'utilisateur (session) est la source de vérité
        // On ne fait confiance à l'IA que si l'utilisateur n'a pas pré-sélectionné
        const sessionDocType = sessionStorage.getItem("kiosk_doc_type");
        if (sessionDocType) {
          setTypePiece(sessionDocType);
        } else if (result.type_piece) {
          const tp = result.type_piece.toLowerCase();
          if (tp.includes("passport") || tp.includes("passeport")) setTypePiece("passeport");
          else if (tp.includes("electeur")) setTypePiece("carte_electeur");
          else if (tp.includes("permis")) setTypePiece("permis");
          else setTypePiece("cni");
        }

        // Numéro : pour carte d'électeur on prend numero_carte, sinon numero_identite / nin
        if (sessionDocType === "carte_electeur") {
          setNumeroPiece(c.numero_carte ?? c.numero_identite ?? c.nin ?? "");
        } else {
          setNumeroPiece(c.numero_identite ?? c.numero_carte ?? c.nin ?? "");
        }
      }
    }).finally(() => setIsLoading(false));

    // Si on a des infos déjà sauvées dans la session, on les charge en priorité (pour le retour en arrière)
    const saved = sessionStorage.getItem("kiosk_client_info");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.nom) setNom(p.nom);
      if (p.prenom) setPrenom(p.prenom);
      if (p.dateNaissance) setDateNaissance(p.dateNaissance);
      if (p.dateExpiration) setDateExpiration(p.dateExpiration);
      if (p.adresse) setAdresse(p.adresse);
      if (p.telephone) setTelephone(p.telephone);
      if (p.numeroPiece) setNumeroPiece(p.numeroPiece);
      if (p.typePiece) setTypePiece(p.typePiece);
    }
  }, []);

  const t = {
    title: lang === "en" ? "Step 2/6 — Confirm your information" : "Étape 2/6 — Confirmation des informations",
    subtitle: lang === "en"
      ? "The information below was pre-filled from your ID document. Please verify and correct if necessary."
      : "Les informations ci-dessous ont été pré-remplies automatiquement à partir de votre pièce d'identité. Vérifiez et corrigez si nécessaire.",
    service: lang === "en" ? "Service:" : "Service :",
    serviceVal: lang === "en" ? "New SIM" : "Nouvelle SIM",
    profileLabel: lang === "en" ? "Profile:" : "Profil :",
    profileVal: profile === "etranger" ? (lang === "en" ? "Foreigner" : "Étranger") : (lang === "en" ? "Resident" : "Résident"),
    status: lang === "en" ? "Status:" : "Statut :",
    statusVal: lang === "en" ? "In progress" : "En cours",
    lastName: lang === "en" ? "Last name" : "Nom",
    firstName: lang === "en" ? "First name" : "Prénom",
    dob: lang === "en" ? "Date of birth" : "Date de naissance",
    dobExpiry: lang === "en" ? "Expiry date" : "Date d'expiration",
    address: lang === "en" ? "Address / District" : "Adresse / Quartier",
    profileType: lang === "en" ? "Profile type" : "Type de profil",
    resident: lang === "en" ? "Resident" : "Résident",
    foreigner: lang === "en" ? "Foreigner" : "Étranger",
    idType: lang === "en" ? "Document type" : "Type de pièce",
    cni: lang === "en" ? "National ID Card" : "Carte Nationale d'Identité",
    passport: lang === "en" ? "Passport" : "Passeport",
    carteElecteur: lang === "en" ? "Voter ID" : "Carte d'électeur",
    permis: lang === "en" ? "Biometric Licence" : "Permis Biométrique",
    idNumber: lang === "en" ? "Document number" : "Numéro de pièce",

    infoNote: lang === "en" ? "Your information has been automatically extracted." : "Vos informations ont été extraites automatiquement.",
    back: lang === "en" ? "Back" : "Retour",
    confirm: lang === "en" ? "Confirm and continue" : "Confirmer et continuer",
    // Décisions IA
    decisionAccepted: lang === "en" ? "✅ Identity validated by the System" : "✅ Identité validée par le Système",
    decisionManual: lang === "en" ? "⚠️ Human verification required" : "⚠️ Vérification humaine requise",
    decisionRejected: lang === "en" ? "❌ Identity rejected" : "❌ Identité rejetée",
    decisionManualDetail: lang === "en"
      ? "Your request will be reviewed by an agent before continuing."
      : "Votre demande sera vérifiée par un agent avant de continuer.",
    decisionRejectedDetail: lang === "en"
      ? "The system was unable to validate your identity. Please contact an agent."
      : "Le système n'a pas pu valider votre identité. Veuillez contacter un agent.",
    similarity: lang === "en" ? "Face similarity" : "Similarité faciale",
    loading: lang === "en" ? "Loading your information..." : "Chargement de vos informations...",
    noKyc: lang === "en" ? "No system result found. Information must be filled in manually." : "Aucun résultat système trouvé. Les informations doivent être saisies manuellement.",
  };

  // Bannière de décision IA
  const renderDecisionBanner = () => {
    if (!kycResult) return null;
    const { decision } = kycResult;
    // Le backend renvoie "face" (snake_case) ; "visage" est l'alias camelCase
    const faceResult = kycResult.face ?? kycResult.visage;
    
    // L'API renvoie des chaînes comme "✅ ACCEPTÉ", "⚠️ VÉRIFICATION MANUELLE", "❌ REJETÉ"
    const decisionUpper = decision.toUpperCase();
    const simPct = faceResult?.similarite != null ? Math.round(faceResult.similarite * 100) : null;

    if (decisionUpper.includes("ACCEPT")) {
      return (
        <div className="mb-5 p-4 bg-success/10 border border-success/30 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-success">{t.decisionAccepted}</p>
            {simPct != null && <p className="text-sm text-success/80 mt-1">{t.similarity} : {simPct}%</p>}
          </div>
        </div>
      );
    }

    if (decisionUpper.includes("MANUELLE") || decisionUpper.includes("ATTENTION") || decisionUpper.includes("VÉRIF")) {
      return (
        <div className="mb-5 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-warning">{t.decisionManual}</p>
            <p className="text-sm text-warning/80 mt-1">{t.decisionManualDetail}</p>
            {simPct != null && <p className="text-sm text-warning/80">{t.similarity} : {simPct}%</p>}
          </div>
        </div>
      );
    }

    if (decisionUpper.includes("REJET")) {
      return (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="w-full">
            <p className="font-bold text-red-600">{t.decisionRejected}</p>
            <p className="text-sm text-red-500 mt-1 mb-2">{t.decisionRejectedDetail}</p>
            {kycResult.details && kycResult.details.length > 0 && (
              <ul className="text-xs text-red-700 bg-red-100/50 p-2 rounded-lg list-disc pl-5">
                {kycResult.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }
    
    // Cas par défaut (inconnu)
    return (
      <div className="mb-5 p-4 bg-gray-50 border border-border-light rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-primary">{decision}</p>
        </div>
      </div>
    );
  };

  const isRejected = kycResult?.decision.toUpperCase().includes("REJET") ?? false;
  // Verrouille tout le formulaire dès qu'une extraction KYC existe
  const isLocked = kycResult !== null;

  if (isLoading) {
    return (
      <Card className="w-full p-2">
        <CardContent className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin mr-3" />
          <p className="text-primary font-semibold">{t.loading}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full p-2">
      <CardHeader className="flex flex-col md:flex-row md:items-start justify-between pb-4 gap-4">
        <div>
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <p className="text-text-muted mt-2 max-w-xl">{t.subtitle}</p>
        </div>
        <div className="bg-gray-50 border border-border-light rounded-xl p-4 min-w-[250px]">
          <div className="flex items-center gap-3 text-sm text-text-main mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-text-muted w-20">{t.service}</span>
            <span className="font-bold">{t.serviceVal}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-main mb-2">
            <UserIcon className="w-4 h-4 text-primary" />
            <span className="text-text-muted w-20">{t.profileLabel}</span>
            <span className="font-bold">{t.profileVal}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-text-main">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-text-muted w-20">{t.status}</span>
            <span className="font-bold text-warning">{t.statusVal}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Bannière décision IA */}
        {renderDecisionBanner()}

        {/* Avertissement si pas de résultat KYC */}
        {!kycResult && (
          <div className="mb-5 p-4 bg-gray-50 border border-border-light rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-text-muted">{t.noKyc}</p>
          </div>
        )}

        {/* Formulaire pré-rempli — verrouillé si extraction KYC disponible */}
        {isLocked && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <p className="text-sm text-blue-700 font-medium">{t.infoNote}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-5">
          <Input
            label={t.lastName}
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            disabled={isLocked}
            readOnly={isLocked}
          />
          <Input
            label={t.firstName}
            required
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            disabled={isLocked}
            readOnly={isLocked}
          />
          <Input
            label={t.dob}
            required
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
            type="date"
            disabled={isLocked}
            readOnly={isLocked}
          />
          <Input
            label={t.dobExpiry}
            value={dateExpiration}
            onChange={(e) => setDateExpiration(e.target.value)}
            type="date"
            disabled={isLocked}
            readOnly={isLocked}
          />
          <Input
            label={t.address}
            required
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            disabled={isLocked}
            readOnly={isLocked}
          />
          <Select
            label={t.profileType}
            required
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            disabled={isLocked}
          >
            <option value="resident">{t.resident}</option>
            <option value="etranger">{t.foreigner}</option>
          </Select>
          <Select
            label={t.idType}
            required
            value={typePiece}
            onChange={(e) => setTypePiece(e.target.value)}
            disabled={isLocked}
          >
            <option value="cni">{t.cni}</option>
            <option value="passeport">{t.passport}</option>
            <option value="carte_electeur">{t.carteElecteur}</option>
            <option value="permis">{t.permis}</option>
          </Select>
          <Input
            label={t.idNumber}
            required
            value={numeroPiece}
            onChange={(e) => setNumeroPiece(e.target.value)}
            disabled={isLocked}
            readOnly={isLocked}
          />

        </div>

        {!isLocked && (
          <div className="flex items-center gap-3 text-sm text-text-muted mb-4">
            <Info className="w-5 h-5 text-primary" />
            {t.infoNote}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button
            onClick={() => {
              // Sauvegarder les informations éditées dans la session
              sessionStorage.setItem("kiosk_client_info", JSON.stringify({
                nom,
                prenom,
                dateNaissance,
                dateExpiration,
                adresse,
                typePiece,
                numeroPiece,
              }));
              const isEsim = sessionStorage.getItem("kiosk_flow") === "esim";
              router.push(isEsim ? "/borne/nouvelle-sim/esim/selfie" : "/borne/nouvelle-sim/selfie");
            }}
            disabled={isRejected || !nom || !prenom || !numeroPiece}
          >
            {t.confirm} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
