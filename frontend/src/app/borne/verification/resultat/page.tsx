"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertTriangle, XCircle, Home, User as UserIcon, Calendar, FileText, MapPin, Loader2, Phone, Hash } from "lucide-react";
import { getKycResult } from "@/lib/kyc.storage";
import type { KycReponse } from "@/types/kyc";

export default function VerificationResultat() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [kycResult, setKycResult] = useState<KycReponse | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingClient, setIsCheckingClient] = useState(false);

  useEffect(() => {
    setLang(sessionStorage.getItem("kiosk_lang") || "fr");
    getKycResult().then((result) => {
      setKycResult(result);
      
      const numPiece = result?.champs?.numero_identite || result?.champs?.numero_carte || result?.champs?.nin;
      if (numPiece) {
        setIsCheckingClient(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        fetch(`${backendUrl}/api/clients/check?numeroPiece=${numPiece}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data?.trouve) {
              setClientInfo(data.data);
            }
          })
          .catch(e => console.error("Erreur check client:", e))
          .finally(() => {
            setIsCheckingClient(false);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const t = {
    title: lang === "en" ? "Verification result" : "Résultat de la vérification",
    subtitle: lang === "en" ? "Here are the details associated with your ID." : "Voici les informations associées à votre pièce d'identité.",
    accepted: lang === "en" ? "Identity verified" : "Identité vérifiée",
    rejected: lang === "en" ? "Verification failed" : "Échec de la vérification",
    manual: lang === "en" ? "Manual verification required" : "Vérification manuelle requise",
    lastName: lang === "en" ? "Last name" : "Nom",
    firstName: lang === "en" ? "First name" : "Prénom",
    dob: lang === "en" ? "Date of birth" : "Date de naissance",
    address: lang === "en" ? "Address / Place of birth" : "Adresse / Lieu de naissance",
    idNumber: lang === "en" ? "Document number" : "Numéro de pièce",
    similarity: lang === "en" ? "Face match" : "Correspondance faciale",
    home: lang === "en" ? "Back to home" : "Retour à l'accueil",
    loading: lang === "en" ? "Loading your results..." : "Chargement de vos résultats...",
    noResult: lang === "en" ? "No verification data found." : "Aucune donnée de vérification trouvée.",
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-4">
        <CardContent className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-primary font-semibold text-lg">{t.loading}</p>
        </CardContent>
      </Card>
    );
  }

  if (!kycResult) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-4">
        <CardContent className="flex flex-col items-center justify-center py-24">
          <AlertTriangle className="w-16 h-16 text-warning mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">{t.rejected}</h2>
          <p className="text-text-muted mb-8">{t.noResult}</p>
          <Button size="lg" onClick={() => router.push("/borne/accueil")}>
            <Home className="w-5 h-5 mr-2" /> {t.home}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { decision, champs, face, visage, details } = kycResult;
  const decisionUpper = decision.toUpperCase();
  const faceResult = face ?? visage;
  const simPct = faceResult?.similarite != null ? Math.round(faceResult.similarite * 100) : null;
  const isAccepted = decisionUpper.includes("ACCEPT");
  const isRejected = decisionUpper.includes("REJET");
  // Cas spécifique : visage non concordant (rejeté à cause du selfie)
  const isFaceMismatch = isRejected && details?.some((d: string) => d.toLowerCase().includes("visage"));

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>
      
      <CardContent>
        {/* En-tête Statut */}
        <div className="flex flex-col items-center justify-center py-6 mb-6 border-b border-border-light">
          {isAccepted ? (
            <div className="w-20 h-20 bg-success/15 rounded-full flex items-center justify-center mb-4 border border-success/30 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
          ) : isRejected ? (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 border border-red-200 shadow-sm">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-warning/15 rounded-full flex items-center justify-center mb-4 border border-warning/30 shadow-sm">
              <AlertTriangle className="w-10 h-10 text-warning" />
            </div>
          )}
          
          <h3 className={`text-2xl font-extrabold mb-1 ${isAccepted ? "text-success" : isRejected ? "text-red-600" : "text-warning"}`}>
            {isAccepted ? t.accepted : isRejected ? t.rejected : t.manual}
          </h3>
          
          {simPct != null && (
            <p className="text-text-main font-medium mt-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
              {t.similarity} : <span className={simPct > 80 ? "text-success" : "text-warning"}>{simPct}%</span>
            </p>
          )}

          {/* Message spécifique si visage non concordant */}
          {isFaceMismatch && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 max-w-md w-full text-center">
              <p className="text-red-700 font-bold text-sm mb-1">{lang === "en" ? "⚠️ Face mismatch" : "⚠️ Visage non concordant"}</p>
              <p className="text-red-600 text-xs">{lang === "en" ? "The captured selfie does not match the photo on the ID. Please contact an agent or try again." : "Le selfie capturé ne correspond pas à la photo présente sur la pièce d'identité. Veuillez contacter un agent ou recommencer."}</p>
            </div>
          )}

          {details && details.length > 0 && !isAccepted && !isFaceMismatch && (
            <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 max-w-md w-full text-left">
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {details.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Informations extraites */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-border-light flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t.lastName}</p>
              <p className="font-bold text-text-main text-lg">{champs?.nom || "—"}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-border-light flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t.firstName}</p>
              <p className="font-bold text-text-main text-lg">{champs?.prenom || "—"}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-border-light flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t.dob}</p>
              <p className="font-bold text-text-main text-lg">{champs?.date_naissance || "—"}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-border-light flex gap-4 items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t.address}</p>
              <p className="font-bold text-text-main text-lg truncate max-w-[200px]" title={champs?.adresse || champs?.lieu_naissance || "—"}>
                {champs?.adresse || champs?.lieu_naissance || "—"}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-border-light flex gap-4 items-center md:col-span-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{t.idNumber}</p>
              <p className="font-bold text-text-main text-lg">{champs?.numero_identite || champs?.numero_carte || champs?.nin || "—"}</p>
            </div>
          </div>
        </div>

        {/* Section: Numéros et Historique Associés */}
        {isCheckingClient ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" />
            <span className="text-text-muted">{lang === "en" ? "Searching for associated numbers..." : "Recherche des numéros associés..."}</span>
          </div>
        ) : clientInfo ? (
          <div className="mb-8 bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" /> {lang === "en" ? "Client Profile & Associated Numbers" : "Profil Client & Numéros Associés"}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="bg-white p-3 rounded-lg border border-border-light shadow-sm flex items-center gap-3">
                <Hash className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-text-muted">{lang === "en" ? "Contact Number" : "Numéro de Contact"}</p>
                  <p className="font-bold text-primary">{clientInfo.client.telephoneContact || (lang === "en" ? "None" : "Aucun")}</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-border-light shadow-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <p className="text-xs text-text-muted">{lang === "en" ? "Account Status" : "Statut du Compte"}</p>
                  <p className="font-bold text-success">{clientInfo.client.statut}</p>
                </div>
              </div>
            </div>

            {clientInfo.numerosActifs && clientInfo.numerosActifs.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-text-main mb-3">{lang === "en" ? "Active numbers linked to this ID:" : "Numéros actifs liés à cette pièce :"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientInfo.numerosActifs.map((num: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border-l-4 border-l-accent shadow-sm flex flex-col">
                      <span className="text-lg font-extrabold text-primary mb-1">+224 {num.numero}</span>
                      <div className="flex justify-between items-center text-xs text-text-muted">
                        <span>{num.offre}</span>
                        <span className="bg-success/10 text-success px-2 py-0.5 rounded-full font-semibold">{num.statut}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-border-light text-center text-sm text-text-muted">
                {lang === "en" ? "No active number found for this ID." : "Aucun numéro actif trouvé pour cette pièce d'identité."}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 bg-amber-50 rounded-2xl p-6 border border-amber-200 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-700 mb-1">{lang === "en" ? "No profile found" : "Aucun profil trouvé"}</p>
              <p className="text-sm text-amber-600">{lang === "en" ? "This ID is not yet associated with an N'ma SIM account. No active SIM number was found." : "Cette pièce d'identité n'est pas encore associée à un compte N'ma SIM. Aucun numéro SIM actif n'a été trouvé."}</p>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4 border-t border-border-light">
          <Button size="lg" onClick={() => router.push("/borne/accueil")} className="px-12">
            <Home className="w-5 h-5 mr-2" /> {t.home}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
