"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ChevronRight, QrCode, Loader2, XCircle, CheckCircle2, Ticket, ShieldCheck } from "lucide-react";
import { QrScanner } from "@/components/borne/QrScanner";
import { verifierReservation, ecrireReservation, libelleProduit, type ReservationBorne } from "@/lib/reservation.client";

/** Extrait un code NMA-XXXX-XXXX d'une saisie ou du contenu d'un QR code. */
function extraireCode(texte: string): string | null {
  const brut = texte.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = brut.match(/NMA([A-Z0-9]{8})/) ?? (brut.length === 8 ? [brut, brut] : null);
  return m ? `NMA-${m[1].slice(0, 4)}-${m[1].slice(4)}` : null;
}

export default function ReservationCode() {
  const router = useRouter();
  const [lang, setLang] = useState("fr");
  const [saisie, setSaisie] = useState("");
  const [scanQr, setScanQr] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resa, setResa] = useState<ReservationBorne | null>(null);

  useEffect(() => { setLang(sessionStorage.getItem("kiosk_lang") || "fr"); }, []);
  const en = lang === "en";

  const t = {
    title: en ? "I have a reservation code" : "J'ai un code de réservation",
    subtitle: en
      ? "Your SIM was booked with your hotel. Scan the QR code of your receipt or type your code."
      : "Votre SIM a été réservée avec votre hôtel. Scannez le QR code de votre reçu ou saisissez votre code.",
    label: en ? "Reservation code" : "Code de réservation",
    scan: en ? "Scan the QR code" : "Scanner le QR code",
    scanHint: en ? "Hold your receipt in front of the camera" : "Présentez votre reçu devant la caméra",
    or: en ? "or" : "ou",
    check: en ? "Check my code" : "Vérifier mon code",
    checking: en ? "Checking..." : "Vérification...",
    invalid: en ? "Please enter a complete code (NMA-XXXX-XXXX)." : "Saisissez un code complet (NMA-XXXX-XXXX).",
    found: en ? "Reservation found" : "Réservation trouvée",
    holder: en ? "Holder" : "Titulaire",
    product: en ? "Product" : "Produit",
    partner: en ? "Booked by" : "Réservée par",
    paid: en ? "Already paid" : "Déjà payée",
    next: en
      ? "Next: scan your passport and take a selfie. Your passport must match the reservation."
      : "Étape suivante : scannez votre passeport et faites un selfie. Votre passeport doit correspondre à la réservation.",
    continue: en ? "Continue" : "Continuer",
    other: en ? "Use another code" : "Utiliser un autre code",
    back: en ? "Back" : "Retour",
  };

  const verifier = async (texte: string) => {
    const code = extraireCode(texte);
    if (!code) { setErreur(t.invalid); return; }
    setSaisie(code);
    setEnCours(true);
    setErreur(null);
    try {
      setResa(await verifierReservation(code));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const continuer = () => {
    if (!resa) return;
    ecrireReservation(resa);
    // Voyageur : seul le passeport est accepté (présélectionné sur l'écran de scan)
    sessionStorage.setItem("kiosk_profile", "etranger");
    if (resa.formatSim === "ESIM" && resa.offre) {
      sessionStorage.setItem("kiosk_flow", "esim");
      sessionStorage.setItem("kiosk_esim_forfait", JSON.stringify({
        id: resa.offre.id,
        nom: resa.offre.nom,
        description: "",
        prixGNF: resa.offre.prix,
        data: resa.offre.data || "—",
        appels: resa.offre.appels || "—",
        sms: resa.offre.sms || "—",
        duree: resa.offre.duree || "30 jours",
        couleur: "#2656A2",
        populaire: false,
      }));
      router.push("/borne/nouvelle-sim/esim/compatibilite");
    } else {
      sessionStorage.removeItem("kiosk_flow");
      router.push("/borne/nouvelle-sim/scan-piece");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-2">
      <CardHeader className="text-center pb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Ticket className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t.title}</CardTitle>
        <p className="text-text-muted mt-2">{t.subtitle}</p>
      </CardHeader>

      <CardContent>
        {resa ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-success/10 border border-success/30 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              <p className="font-bold text-success">{t.found} · <span className="font-mono">{resa.code}</span></p>
            </div>
            <div className="border border-border-light rounded-xl divide-y divide-border-light bg-white">
              {[
                [t.holder, `${resa.prenom} ${resa.nomInitiale}`],
                [t.product, libelleProduit(resa, lang)],
                [t.partner, resa.partenaireNom],
              ].map(([label, valeur]) => (
                <div key={label} className="flex justify-between gap-4 p-4">
                  <span className="text-sm text-text-muted">{label}</span>
                  <span className="font-bold text-primary text-right">{valeur}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-text-muted">{en ? "Payment" : "Paiement"}</span>
                <span className="font-bold text-success">{t.paid}</span>
              </div>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3 text-sm text-primary">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{t.next}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border-light">
              <Button variant="secondary" onClick={() => { setResa(null); setSaisie(""); }}>{t.other}</Button>
              <Button data-ai-action="btn-continuer-reservation" onClick={continuer} className="px-10 h-12">
                {t.continue} <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* QR code à gauche, saisie du code à droite */}
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch">
              {scanQr ? (
                <QrScanner lang={lang} onDetect={(texte) => { setScanQr(false); verifier(texte); }} onCancel={() => setScanQr(false)} />
              ) : (
                <button
                  data-ai-action="btn-scanner-qr-reservation"
                  onClick={() => { setErreur(null); setScanQr(true); }}
                  className="flex flex-col items-center justify-center gap-3 p-6 min-h-[200px] border-2 border-dashed border-primary/30 rounded-2xl hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-9 h-9 text-primary" />
                  </span>
                  <span className="font-bold text-primary text-lg">{t.scan}</span>
                  <span className="text-sm text-text-muted">{t.scanHint}</span>
                </button>
              )}

              {/* Séparateur « ou » : vertical sur grand écran, horizontal sinon */}
              <div className="flex md:flex-col items-center justify-center gap-3 text-xs font-bold text-text-muted uppercase">
                <span className="flex-1 h-px md:h-auto md:w-px bg-border-light" />
                {t.or}
                <span className="flex-1 h-px md:h-auto md:w-px bg-border-light" />
              </div>

              <div className="flex flex-col justify-center gap-3">
                <label className="block text-sm font-semibold text-text-main">{t.label}</label>
                <input
                  data-ai-action="input-code-reservation"
                  value={saisie}
                  onChange={(e) => { setSaisie(e.target.value.toUpperCase()); setErreur(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") verifier(saisie); }}
                  placeholder="NMA-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-4 text-2xl font-mono tracking-widest text-center text-primary border-2 border-border-light rounded-xl focus:outline-none focus:border-primary"
                />
                <Button data-ai-action="btn-verifier-reservation" onClick={() => verifier(saisie)} disabled={enCours || !saisie.trim()} className="w-full h-12">
                  {enCours ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t.checking}</> : <>{t.check} <ChevronRight className="w-5 h-5 ml-2" /></>}
                </Button>
              </div>
            </div>

            {erreur && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" /> {erreur}
              </div>
            )}

            <div className="flex justify-start pt-4 border-t border-border-light">
              <Button variant="secondary" onClick={() => router.push("/borne/services")}>
                <ArrowLeft className="w-5 h-5 mr-2" /> {t.back}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
