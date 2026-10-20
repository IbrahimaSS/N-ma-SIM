"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ChevronRight, ArrowLeft, XCircle, Loader2, RotateCcw } from "lucide-react";
import { getKycResult } from "@/lib/kyc.storage";
import { identiteValidee, expliquerDecision } from "@/lib/kyc.decision";
import { libelleNumeroPiece } from "@/lib/piece";
import type { KycReponse, KycChampsExtraits } from "@/types/kyc";

/**
 * Récapitulatif de la réactivation avant paiement (même logique que la nouvelle SIM) :
 * informations saisies + identité lue sur la pièce + résultat RÉEL de la vérification.
 * Seule une identité validée permet de continuer vers le paiement.
 */
export default function Verification() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [numero, setNumero] = useState("—");
  const [motif, setMotif] = useState("");
  const [typePiece, setTypePiece] = useState<string | null>(null);
  const [kycResult, setKycResult] = useState<KycReponse | null>(null);
  const [champs, setChamps] = useState<KycChampsExtraits>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    setNumero(sessionStorage.getItem("reactivation_numero") || "—");
    setMotif(sessionStorage.getItem("reactivation_motif") || "");
    setTypePiece(sessionStorage.getItem("kiosk_doc_type"));

    getKycResult()
      .then((result) => {
        setKycResult(result ?? null);
        let c: KycChampsExtraits = result?.champs ?? {};
        // Repli : champs lus à l'étape « pièce d'identité »
        if (!c.nom && !c.prenom) {
          try {
            const brut = sessionStorage.getItem("kyc_champs");
            if (brut) c = JSON.parse(brut);
          } catch { /* garder les champs vides */ }
        }
        setChamps(c);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const en = lang === "en";
  const motifLabel: Record<string, string> = {
    perte: en ? "Lost SIM card" : "Perte de la carte SIM",
    inactivite: en ? "Long inactivity period" : "Longue période d'inactivité",
    desactivee: en ? "Disabled SIM" : "Puce désactivée",
  };

  const t = {
    title: en ? "SIM Reactivation — Summary" : "Réactivation — Récapitulatif",
    subtitle: en ? "Check that the information below is correct before payment." : "Vérifiez que les informations ci-dessous sont exactes avant le paiement.",
    request: en ? "Your request" : "Votre demande",
    numberLabel: en ? "Number to reactivate" : "Numéro à réactiver",
    reason: en ? "Reason" : "Motif",
    holder: en ? "Holder" : "Titulaire",
    fullName: en ? "Full name" : "Nom et prénom",
    birth: en ? "Date of birth" : "Date de naissance",
    edit: en ? "Edit" : "Modifier",
    verifiedTitle: en ? "Identity verified" : "Identité vérifiée",
    verifiedSub: en ? "Your selfie matches the photo on your ID document." : "Votre selfie correspond à la photo de votre pièce d'identité.",
    noResultTitle: en ? "Identity not verified" : "Identité non vérifiée",
    noResultSub: en ? "Please scan your ID document and take your selfie again." : "Veuillez scanner à nouveau votre pièce d'identité et reprendre votre selfie.",
    retry: en ? "Verify again" : "Reprendre la vérification",
    back: en ? "Back" : "Retour",
    continue: en ? "Continue to payment" : "Continuer vers le paiement",
    loading: en ? "Loading..." : "Chargement...",
  };

  const valide = identiteValidee(kycResult);
  const explication = kycResult && !valide ? expliquerDecision(kycResult, lang) : null;
  const nomComplet = [champs.prenom, champs.nom].filter(Boolean).join(" ").toUpperCase() || "—";
  const numeroPiece = champs.numero_identite || champs.numero_carte || champs.nin || "—";

  const ligne = (label: string, valeur: string) => (
    <div key={label} className="flex justify-between items-center gap-4 p-4">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="font-bold text-primary text-right">{valeur}</p>
    </div>
  );

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-3xl text-primary font-bold">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>

      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Demande */}
        <div className="border border-border-light rounded-xl overflow-hidden bg-white">
          <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-border-light">
            <h3 className="font-bold text-primary">{t.request}</h3>
            <Button variant="secondary" size="sm" className="bg-white" onClick={() => router.push("/borne/reactivation/identification")}>{t.edit}</Button>
          </div>
          <div className="divide-y divide-border-light">
            {ligne(t.numberLabel, numero)}
            {ligne(t.reason, motifLabel[motif] || motif || "—")}
          </div>
        </div>

        {/* Titulaire (lu sur la pièce) */}
        <div className="border border-border-light rounded-xl overflow-hidden bg-white">
          <div className="bg-gray-50 px-4 py-3 border-b border-border-light">
            <h3 className="font-bold text-primary">{t.holder}</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-text-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> {t.loading}
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {ligne(t.fullName, nomComplet)}
              {ligne(t.birth, champs.date_naissance || "—")}
              {ligne(libelleNumeroPiece(typePiece, lang), numeroPiece)}
            </div>
          )}
        </div>

        {/* Résultat réel de la vérification d'identité */}
        {!isLoading && (
          valide ? (
            <div className="lg:col-span-2 p-4 bg-success/10 border border-success/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              <div>
                <p className="font-bold text-success">{t.verifiedTitle}</p>
                <p className="text-sm text-green-800 mt-1">{t.verifiedSub}</p>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-red-700">{explication?.titre || t.noResultTitle}</p>
                <p className="text-sm text-red-700/90 mt-1">{explication?.message || t.noResultSub}</p>
                <Button variant="secondary" size="sm" className="mt-3 bg-white" onClick={() => router.push("/borne/reactivation/piece-identite")}>
                  <RotateCcw className="w-4 h-4 mr-2" /> {t.retry}
                </Button>
              </div>
            </div>
          )
        )}

        {/* Navigation */}
        <div className="col-span-1 lg:col-span-2 flex justify-between items-center pt-4 border-t border-border-light mt-2">
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
          </Button>
          <Button
            data-ai-action="btn-continuer-verification"
            disabled={isLoading || !valide}
            onClick={() => {
              sessionStorage.setItem("reactivation_verified_ok", "1");
              router.push("/borne/reactivation/paiement");
            }}
            className="px-10 h-12 shadow-sm"
          >
            {t.continue} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
