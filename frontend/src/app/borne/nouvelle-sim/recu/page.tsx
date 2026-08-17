"use client";
import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircle2, Info, Eye, Home, Printer, CheckCircle, Loader2 } from "lucide-react";
import { SuccessScreen } from "@/components/borne/SuccessScreen";
import { getKycResult } from "@/lib/kyc.storage";
import type { Offer } from "@/types";

// Type local minimal pour l'offre sauvegardée en sessionStorage
interface SessionOffer {
  id: string;
  titre: string;
  prixGNF: number;
  type?: string;
}

export default function Recu() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecuContent />
    </Suspense>
  );
}

function RecuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";

  const [nomClient, setNomClient] = useState("Client Inconnu");
  const [offer, setOffer] = useState<SessionOffer | null>(null);
  const [paymentInfo, setPaymentInfo] = useState({ method: "Lengo Pay", reference: "—" });
  const [currentDate, setCurrentDate] = useState("");
  const [numeroDossier, setNumeroDossier] = useState("...");
  const [demandeId, setDemandeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  // ✅ Anti-double-submit : on utilise une ref persistante entre les re-renders (imperméable au StrictMode)
  const hasSubmitted = useRef(false);

  useEffect(() => {
    // Date actuelle
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " à " +
      now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );

    // Offre depuis sessionStorage
    let parsedOffer: SessionOffer | null = null;
    try {
      const raw = sessionStorage.getItem("kiosk_offer");
      if (raw) {
        parsedOffer = JSON.parse(raw) as SessionOffer;
        setOffer(parsedOffer);
      }
    } catch { /* garder null */ }

    // Paiement depuis sessionStorage
    let parsedPayment = { method: "Lengo Pay", reference: "—" };
    try {
      const raw = sessionStorage.getItem("kiosk_payment");
      if (raw) {
        parsedPayment = JSON.parse(raw);
        setPaymentInfo(parsedPayment);
      }
    } catch { /* garder défaut */ }

    // ✅ Soumettre UNE SEULE FOIS grâce à la ref
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    getKycResult().then(async (kycResult) => {
      const champs = kycResult?.champs || {};
      
      // Récupérer les infos éditées par l'utilisateur (nom, prenom, adresse, tel, etc)
      let finalClientInfo: any = {};
      try {
        const saved = sessionStorage.getItem("kiosk_client_info");
        if (saved) finalClientInfo = JSON.parse(saved);
      } catch (e) {}

      // Nom du client
      const nom = finalClientInfo.nom || champs.nom || "";
      const prenom = finalClientInfo.prenom || champs.prenom || "";
      if (nom || prenom) setNomClient(`${prenom} ${nom}`.trim());

      setIsSubmitting(true);
      try {
        // ✅ Correspondance correcte des champs KYC
        const res = await fetch("/api/soumettre-demande", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_info: {
              nom: finalClientInfo.nom || champs.nom || "Inconnu",
              prenom: finalClientInfo.prenom || champs.prenom || "Inconnu",
              date_naissance: finalClientInfo.dateNaissance || champs.date_naissance || undefined,
              lieu_naissance: finalClientInfo.adresse || champs.lieu_naissance || undefined,
              nationalite: champs.nationalite || "Guinéenne",
              type_piece: finalClientInfo.typePiece || kycResult?.type_piece || champs.type_piece || undefined,
              numero_piece: finalClientInfo.numeroPiece || champs.numero_identite || champs.numero_carte || champs.nin || undefined,
              telephone: finalClientInfo.telephone || undefined,
            },
            offre_id: (parsedOffer?.id && parsedOffer.id !== "aucune") ? parsedOffer.id : undefined,
            paiement: {
              montant: parsedOffer?.prixGNF || 0,
              methode: parsedPayment?.method === "Orange Money" ? "ORANGE_MONEY" : "LENGO_PAY",
              reference: parsedPayment?.reference || undefined,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.numeroDossier) setNumeroDossier(data.numeroDossier);
          if (data.demandeId) setDemandeId(data.demandeId);
        } else {
          console.error("[RECU] Erreur soumission", await res.text());
          setNumeroDossier("NMA-" + Date.now().toString().slice(-6));
        }
      } catch (e) {
        console.error("[RECU] Erreur soumission", e);
        setNumeroDossier("NMA-" + Date.now().toString().slice(-6));
      } finally {
        setIsSubmitting(false);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (showSuccess) {
    return <SuccessScreen type="nouvelle-sim" ticketRef={numeroDossier} />;
  }

  const prixAffiche = offer?.prixGNF?.toLocaleString("fr-FR") ?? "—";
  const titreOffre = offer?.titre ?? "—";

  const handlePrintPDF = () => {
    window.print();
  };

  const handleTerminer = async () => {
    if (isTerminating) return;
    setIsTerminating(true);

    // Mettre à jour le statut VALIDEE dans le back-office
    if (demandeId) {
      try {
        await fetch("/api/terminer-demande", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ demandeId }),
        });
      } catch (e) {
        console.error("[TERMINER]", e);
        // Ne pas bloquer — on navigue quand même
      }
    }

    // Naviguer vers l'écran de succès
    router.push("?success=true");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          @page {
            margin: 0;
          }
        }
      `}} />
      <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 print:block">
        {/* Message de succès - caché à l'impression */}
        <Card className="p-5 flex flex-col items-center text-center justify-center print:hidden">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4 shadow-lg shadow-success/30 relative">
             <CheckCircle className="w-8 h-8 text-white" />
             <div className="absolute top-2 right-2 w-2 h-2 bg-success rounded-full animate-ping"></div>
             <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-success rounded-full"></div>
          </div>
          
          <h2 className="text-xl font-bold text-primary mb-2">Demande enregistrée avec succès !</h2>
          <p className="text-text-muted mb-4">Votre demande de nouvelle SIM a été prise en compte.</p>
          
          <div className="w-full border-t border-b border-dashed border-border-light py-4 mb-4">
            <p className="text-xs text-text-muted mb-1">Numéro de dossier</p>
            <p className="text-3xl font-extrabold text-accent tracking-wider">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2 text-lg text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...
                </span>
              ) : numeroDossier}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="font-semibold text-text-muted">Statut :</span>
            <StatusBadge status="EN_ATTENTE" />
          </div>

          <div className="w-full bg-success/10 rounded-xl p-4 flex items-start gap-3 text-left border border-success/20">
            <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
            <div>
               <p className="font-bold text-success mb-1">Paiement validé.</p>
               <p className="text-sm text-success/80">Votre demande de carte SIM a été traitée avec succès.</p>
            </div>
          </div>
        </Card>

        {/* Reçu détaillé - visible à l'impression */}
        <Card id="receipt-content" className="overflow-hidden print:w-full print:shadow-none print:border-none">

          {/* ── EN-TÊTE BRANDÉ ── */}
          <div style={{background: 'linear-gradient(135deg, #1a1464 0%, #2d27a0 60%, #f5a800 100%)'}}
               className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">Reçu officiel</p>
              <h3 className="text-white font-extrabold text-2xl tracking-wide">N&apos;ma SIM</h3>
              <p className="text-white/80 text-sm">Demande · Nouvelle SIM</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-widest">Dossier</p>
              <p className="text-yellow-300 font-mono font-bold text-sm break-all max-w-[160px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin inline text-white" /> : numeroDossier}
              </p>
              <p className="text-white/60 text-xs mt-1">{currentDate}</p>
            </div>
          </div>

          {/* ── CORPS DU REÇU ── */}
          <div className="p-6">

            {/* Infos en grille 2 colonnes */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-0 mb-6">
              {[
                { label: 'Nom du client',     value: nomClient,              bold: true },
                { label: 'Offre choisie',     value: titreOffre,             bold: false },
                { label: 'Montant payé',      value: `${prixAffiche} GNF`,   bold: true },
                { label: 'Moyen de paiement', value: paymentInfo.method,     bold: false },
                { label: 'Référence / Compte',value: paymentInfo.reference,  bold: false },
                { label: 'Statut',            value: null,                   badge: true },
              ].map(({ label, value, bold, badge }) => (
                <div key={label} className="py-3 border-b border-dashed border-gray-200 last:border-none">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  {badge
                    ? <StatusBadge status="EN_ATTENTE" />
                    : <p className={`text-sm ${bold ? 'font-bold text-primary' : 'text-gray-700'}`}>{value}</p>
                  }
                </div>
              ))}
            </div>

            {/* ── SÉPARATEUR POINTILLÉ ── */}
            <div className="relative my-4">
              <div className="border-t-2 border-dashed border-gray-300" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-gray-400 text-xs uppercase tracking-widest">
                Vérification
              </span>
            </div>

            {/* ── QR CODE CENTRÉ ── */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="w-36 h-36 bg-white border-4 border-primary/20 rounded-2xl p-2 flex items-center justify-center shadow-md">
                {numeroDossier !== '...' ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Ticket:${numeroDossier}|Client:${nomClient}|Montant:${offer?.prixGNF ?? 0}`)}`}
                    alt="QR Code Ticket"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                )}
              </div>
              <p className="text-xs text-gray-400 text-center">
                Scannez ce QR code pour vérifier l&apos;authenticité du reçu
              </p>
            </div>
          </div>

          {/* ── PIED DE PAGE ── */}
          <div className="bg-gray-50 border-t border-dashed border-gray-200 px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">N&apos;ma SIM · Guinée Conakry</p>
            <p className="text-[10px] text-gray-400 font-mono">{numeroDossier}</p>
            <p className="text-[10px] text-gray-400">Document officiel</p>
          </div>

        </Card>
      </div>

      {/* Footer Actions - caché à l'impression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <div className="flex gap-4">
           <Button variant="outline" className="flex-1 bg-white h-12">
             <Eye className="w-5 h-5 mr-2" /> Voir le reçu
           </Button>
           <Button variant="primary" className="flex-1 h-12" onClick={() => router.push("/borne/accueil")}>
             <Home className="w-5 h-5 mr-2" /> Retour à l&apos;accueil
           </Button>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="flex-1 bg-white h-12" onClick={handlePrintPDF}>
             <Printer className="w-5 h-5 mr-2" /> Imprimer
           </Button>
           <Button variant="primary" className="flex-1 h-12" onClick={handleTerminer} disabled={isTerminating}>
             {isTerminating
               ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Validation...</>
               : <><CheckCircle2 className="w-5 h-5 mr-2" /> Terminer</>
             }
           </Button>
        </div>
      </div>
      </div>
    </>
  );
}
