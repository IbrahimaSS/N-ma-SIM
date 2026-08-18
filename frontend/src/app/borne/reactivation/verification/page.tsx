"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ChevronRight, ArrowLeft, Hourglass, Info, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getKycResult } from "@/lib/kyc.storage";
import type { KycReponse } from "@/types/kyc";

export default function Verification() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");

  // Données de la session (étape 1)
  const [numero, setNumero] = useState("");
  const [motif, setMotif] = useState("");

  // Résultat KYC (extrait de IndexedDB)
  const [kycResult, setKycResult] = useState<KycReponse | null>(null);
  const [identiteNom, setIdentiteNom] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");

    // Récupérer les données saisies en étape 1
    setNumero(sessionStorage.getItem("reactivation_numero") || "—");
    const motifVal = sessionStorage.getItem("reactivation_motif") || "";
    setMotif(motifVal);

    // Récupérer le résultat KYC (avec selfie) depuis IndexedDB
    getKycResult().then((result) => {
      if (result) {
        setKycResult(result);
        // Lire les champs depuis KYC complet
        const c = result.champs ?? {};
        const nom = c.nom ?? "";
        const prenom = c.prenom ?? "";
        const fullName = [prenom, nom].filter(Boolean).join(" ").toUpperCase();
        if (fullName) {
          setIdentiteNom(fullName);
        } else {
          // Fallback : champs extraits depuis la page pièce (sessionStorage)
          try {
            const champsJson = sessionStorage.getItem("kyc_champs");
            if (champsJson) {
              const champs = JSON.parse(champsJson);
              const fallbackName = [champs.prenom ?? "", champs.nom ?? ""].filter(Boolean).join(" ").toUpperCase();
              setIdentiteNom(fallbackName || "—");
            } else {
              setIdentiteNom("—");
            }
          } catch { setIdentiteNom("—"); }
        }
      } else {
        // Aucun résultat KYC complet — essayer le fallback sessionStorage
        try {
          const champsJson = sessionStorage.getItem("kyc_champs");
          if (champsJson) {
            const champs = JSON.parse(champsJson);
            const fallbackName = [champs.prenom ?? "", champs.nom ?? ""].filter(Boolean).join(" ").toUpperCase();
            setIdentiteNom(fallbackName || "—");
          }
        } catch { setIdentiteNom("—"); }
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const motifLabel: Record<string, string> = {
    perte: lang === "en" ? "Lost SIM card" : "Perte de la carte SIM",
    inactivite: lang === "en" ? "Long inactivity period" : "Longue période d'inactivité",
    desactivee: lang === "en" ? "Disabled SIM" : "Puce désactivée",
  };

  const t = {
    title: lang === "en" ? "SIM Reactivation" : "Réactivation des puces",
    subtitle: lang === "en" ? "We are verifying the information provided to secure your reactivation." : "Nous vérifions les informations fournies pour sécuriser votre réactivation.",
    summary: lang === "en" ? "Information summary" : "Résumé des informations",
    edit: lang === "en" ? "Edit" : "Modifier",
    numberLabel: lang === "en" ? "Number to reactivate" : "Numéro à réactiver",
    reason: lang === "en" ? "Reason" : "Motif",
    identity: lang === "en" ? "Extracted identity" : "Identité extraite",
    lineCheck: lang === "en" ? "Line check in progress" : "Contrôle de ligne en cours",
    lineCheckSub: lang === "en" ? "We are verifying your line eligibility with the operator." : "Nous vérifions l'éligibilité de votre ligne auprès de l'opérateur.",
    aiOk: lang === "en" ? "AI analysis successful" : "Analyse IA réussie",
    aiOkSub: lang === "en" ? "Documents and selfie were analysed successfully." : "Les documents et le selfie ont été analysés avec succès.",
    faceOk: lang === "en" ? "Face / document match validated" : "Correspondance visage / document validée",
    faceOkSub: lang === "en" ? "Match confirmed by our AI system." : "La correspondance a été confirmée par notre système IA.",
    faceKo: lang === "en" ? "Face / document match not confirmed" : "Correspondance visage / document non confirmée",
    faceKoSub: lang === "en" ? "Manual verification required by an agent." : "Une vérification manuelle par un agent est requise.",
    opCheck: lang === "en" ? "Operator verification in progress" : "Vérification opérateur en cours",
    opCheckSub: lang === "en" ? "We are verifying your line eligibility with the operator." : "Nous vérifions l'éligibilité de votre ligne auprès de l'opérateur.",
    wait: lang === "en" ? "Please wait, this may take a few moments." : "Veuillez patienter, cela peut prendre quelques instants.",
    similarity: lang === "en" ? "Face similarity" : "Similarité faciale",
    back: lang === "en" ? "Back" : "Retour",
    continue: lang === "en" ? "Continue" : "Continuer",
    loading: lang === "en" ? "Loading..." : "Chargement...",
    noKyc: lang === "en" ? "No AI result — manual verification required." : "Aucun résultat IA — vérification manuelle requise.",
  };

  // Déterminer si la correspondance visage/document est OK
  const decisionUpper = (kycResult?.decision ?? "").toUpperCase();
  const faceData = kycResult?.visage ?? kycResult?.face ?? null;
  // Logique de match : on accepte si :
  // 1. La décision contient "ACCEPT" (toutes langues) ou "VALID" ou "OK"
  // 2. OU face.verifie === true
  // 3. OU similarite >= 0.5 (50% — seuil raisonnable pour selfie kiosque)
  const decisionNorm = decisionUpper
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Enlève les accents (ACCEPTÉ → ACCEPTE)
  const isFaceOk = 
    decisionNorm.includes("ACCEPT") ||
    decisionNorm.includes("VALID") ||
    decisionNorm.includes(" OK") ||
    faceData?.verifie === true ||
    (faceData?.similarite ?? 0) >= 0.5;
  const simPct = faceData?.similarite != null ? Math.round(faceData.similarite * 100) : null;

  // Statut identité selon résultat KYC
  const identiteStatut = kycResult
    ? (isFaceOk ? "VALIDEE" : "EN_ATTENTE_VALIDATION")
    : "EN_ATTENTE_VALIDATION";

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-3xl text-primary font-bold">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>

      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── Résumé des informations ─── */}
        <div>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-t-xl border border-b-0 border-border-light">
            <h3 className="font-bold text-primary text-lg">{t.summary}</h3>
            <Button variant="secondary" size="sm" className="bg-white" onClick={() => router.push("/borne/reactivation/identification")}>{t.edit}</Button>
          </div>
          <div className="border border-border-light rounded-b-xl overflow-hidden divide-y divide-border-light bg-white">
            {/* Numéro */}
            <div className="flex justify-between items-center p-4">
              <div>
                <p className="text-xs text-text-muted font-semibold">{t.numberLabel}</p>
                <p className="font-bold text-primary">{numero || "—"}</p>
              </div>
              <StatusBadge status="CONFIRME" />
            </div>
            {/* Motif */}
            <div className="flex justify-between items-center p-4">
              <div>
                <p className="text-xs text-text-muted font-semibold">{t.reason}</p>
                <p className="font-bold text-primary">{motifLabel[motif] || motif || "—"}</p>
              </div>
              <StatusBadge status="CONFIRME" />
            </div>
            {/* Identité extraite par IA */}
            <div className="flex justify-between items-center p-4">
              <div>
                <p className="text-xs text-text-muted font-semibold">{t.identity}</p>
                <p className="font-bold text-primary">{isLoading ? "..." : (identiteNom || "—")}</p>
                {simPct !== null && (
                  <p className="text-xs text-text-muted mt-0.5">{t.similarity} : {simPct}%</p>
                )}
              </div>
              <StatusBadge status={identiteStatut as any} />
            </div>
          </div>
        </div>

        {/* ─── Résultat KYC / Contrôle de ligne ─── */}
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-accent/20 p-3 rounded-full flex-shrink-0">
              <Hourglass className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">{t.lineCheck}</h3>
              <p className="text-text-muted text-sm mt-1">{t.lineCheckSub}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mb-4">
            {/* Étape 1 : Analyse IA */}
            <div className="flex gap-3">
              {kycResult ? (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <Hourglass className="w-5 h-5 text-warning flex-shrink-0 mt-0.5 animate-pulse" />
              )}
              <div>
                <p className="font-bold text-primary text-sm">{t.aiOk}</p>
                <p className="text-xs text-text-muted">{kycResult ? t.aiOkSub : t.noKyc}</p>
              </div>
            </div>

            {/* Étape 2 : Correspondance visage */}
            <div className="flex gap-3">
              {kycResult ? (
                isFaceOk ? (
                  <ShieldCheck className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                )
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-border-light flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-primary text-sm">{isFaceOk ? t.faceOk : t.faceKo}</p>
                <p className="text-xs text-text-muted">{isFaceOk ? t.faceOkSub : t.faceKoSub}</p>
              </div>
            </div>

            {/* Étape 3 : Vérification opérateur */}
            <div className="flex gap-3">
              <Hourglass className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary text-sm">{t.opCheck}</p>
                <p className="text-xs text-text-muted">{t.opCheckSub}</p>
              </div>
            </div>
          </div>

          {/* Bannière KYC rejeté */}
          {kycResult && !isFaceOk && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>La correspondance faciale n'a pas pu être confirmée. Un agent validera votre demande.</span>
            </div>
          )}

          <div className="bg-warning/10 p-4 rounded-xl flex items-center gap-3 text-warning border border-warning/20">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{t.wait}</p>
          </div>
        </div>

        {/* ─── Navigation ─── */}
        <div className="col-span-1 lg:col-span-2 flex justify-between items-center pt-4 border-t border-border-light mt-4">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button onClick={() => router.push("/borne/reactivation/paiement")} className="px-10 h-12 shadow-sm">
            {t.continue} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
