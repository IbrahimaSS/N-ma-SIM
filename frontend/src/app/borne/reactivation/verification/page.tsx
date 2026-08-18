"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ChevronRight, ArrowLeft, Hourglass, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function Verification() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  useEffect(() => { setLang(sessionStorage.getItem("kiosk_lang") || "fr"); }, []);

  const t = {
    title: lang === "en" ? "SIM Reactivation" : "Réactivation des puces",
    subtitle: lang === "en" ? "We are verifying the information provided to secure your reactivation." : "Nous vérifions les informations fournies pour sécuriser votre réactivation.",
    summary: lang === "en" ? "Information summary" : "Résumé des informations",
    edit: lang === "en" ? "Edit" : "Modifier",
    numberLabel: lang === "en" ? "Number to reactivate" : "Numéro à réactiver",
    reason: lang === "en" ? "Reason" : "Motif",
    reasonVal: lang === "en" ? "Lost SIM card" : "Perte de la carte SIM",
    identity: lang === "en" ? "Extracted identity" : "Identité extraite",
    lineCheck: lang === "en" ? "Line check in progress" : "Contrôle de ligne en cours",
    lineCheckSub: lang === "en" ? "We are verifying your line eligibility with the operator." : "Nous vérifions l'éligibilité de votre ligne auprès de l'opérateur.",
    aiOk: lang === "en" ? "AI analysis successful" : "Analyse IA réussie",
    aiOkSub: lang === "en" ? "Documents and selfie were analysed successfully." : "Les documents et le selfie ont été analysés avec succès.",
    faceOk: lang === "en" ? "Face / document match validated" : "Correspondance visage / document validée",
    faceOkSub: lang === "en" ? "The match was confirmed by our AI system." : "La correspondance a été confirmée par notre système IA.",
    opCheck: lang === "en" ? "Operator verification in progress" : "Vérification opérateur en cours",
    opCheckSub: lang === "en" ? "We are verifying your line eligibility with the operator." : "Nous vérifions l'éligibilité de votre ligne auprès de l'opérateur.",
    wait: lang === "en" ? "Please wait, this may take a few moments." : "Veuillez patienter, cela peut prendre quelques instants.",
    back: lang === "en" ? "Back" : "Retour",
    continue: lang === "en" ? "Continue" : "Continuer",
  };

  return (
    <Card className="w-full p-2">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-3xl text-primary font-bold">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-t-xl border border-b-0 border-border-light">
            <h3 className="font-bold text-primary text-lg">{t.summary}</h3>
            <Button variant="secondary" size="sm" className="bg-white">{t.edit}</Button>
          </div>
          <div className="border border-border-light rounded-b-xl overflow-hidden divide-y divide-border-light bg-white">
            <div className="flex justify-between items-center p-4">
              <div><p className="text-xs text-text-muted font-semibold">{t.numberLabel}</p><p className="font-bold text-primary">06 12 34 56 78</p></div>
              <StatusBadge status="CONFIRME" />
            </div>
            <div className="flex justify-between items-center p-4">
              <div><p className="text-xs text-text-muted font-semibold">{t.reason}</p><p className="font-bold text-primary">{t.reasonVal}</p></div>
              <StatusBadge status="CONFIRME" />
            </div>
            <div className="flex justify-between items-center p-4">
              <div><p className="text-xs text-text-muted font-semibold">{t.identity}</p><p className="font-bold text-primary">Jean Paul KOUASSI</p></div>
              <StatusBadge status="VALIDEE" />
            </div>
          </div>
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-accent/20 p-3 rounded-full flex-shrink-0"><Hourglass className="w-8 h-8 text-accent animate-pulse" /></div>
            <div><h3 className="text-xl font-bold text-primary">{t.lineCheck}</h3><p className="text-text-muted text-sm mt-1">{t.lineCheckSub}</p></div>
          </div>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div><p className="font-bold text-primary text-sm">{t.aiOk}</p><p className="text-xs text-text-muted">{t.aiOkSub}</p></div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div><p className="font-bold text-primary text-sm">{t.faceOk}</p><p className="text-xs text-text-muted">{t.faceOkSub}</p></div>
            </div>
            <div className="flex gap-3">
              <Hourglass className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div><p className="font-bold text-primary text-sm">{t.opCheck}</p><p className="text-xs text-text-muted">{t.opCheckSub}</p></div>
            </div>
          </div>
          <div className="bg-warning/10 p-4 rounded-xl flex items-center gap-3 text-warning border border-warning/20">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{t.wait}</p>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 flex justify-between items-center pt-4 border-t border-border-light mt-4">
          <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-5 h-5 mr-2" /> {t.back}</Button>
          <Button onClick={() => router.push("/borne/reactivation/paiement")} className="px-10 h-12 shadow-sm">
            {t.continue} <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
