"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Home, Mail, Printer, ShieldCheck, CheckCircle2, Smartphone, Loader2 } from "lucide-react";
import { resetKioskSession } from "@/lib/kiosk-guard";

export default function EsimQrCode() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [mailError, setMailError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kiosk_esim_profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch {}

    if (!sessionStorage.getItem("kiosk_esim_profile")) {
      router.replace("/borne/nouvelle-sim/esim/recapitulatif");
    }
  }, [router]);

  const handleTerminer = async () => {
    // Confirme la validation côté back-office (comme le parcours physique), sans bloquer si indisponible
    if (profile?.demandeId) {
      try {
        await fetch("/api/terminer-demande", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ demandeId: profile.demandeId }),
        });
      } catch (e) {
        console.error("[ESIM] terminer-demande", e);
      }
    }
    await resetKioskSession();
    router.push("/borne/accueil");
  };

  const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendMail = async () => {
    if (!emailValide) return;
    setIsSendingMail(true);
    setMailError(null);
    try {
      const res = await fetch("/api/esim/envoyer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reference: profile?.reference,
          numeroDossier: profile?.numeroDossier,
          nomClient: profile?.nomClient,
          qrString: profile?.qrString,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setMailSent(true);
      } else {
        setMailError(data?.error || "Envoi impossible pour le moment. Réessayez.");
      }
    } catch (e) {
      console.error(e);
      setMailError("Réseau indisponible. Réessayez dans un instant.");
    } finally {
      setIsSendingMail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!profile) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #esim-receipt, #esim-receipt * { visibility: visible; }
          #esim-receipt { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
      <div className="flex flex-col w-full pb-8 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Instructions d'installation */}
          <Card className="p-6 print:hidden">
            <div className="flex items-center gap-3 mb-6 bg-success/10 p-4 rounded-xl border border-success/20">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <div>
                <h2 className="text-lg font-bold text-success">eSIM Prête !</h2>
                <p className="text-sm text-success/80">Votre profil a été généré avec succès.</p>
              </div>
            </div>

            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> Comment l&apos;installer ?
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                <p className="text-sm text-text-main">Allez dans les <strong>Paramètres</strong> de votre téléphone.</p>
              </div>
              <div className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                <p className="text-sm text-text-main">Sélectionnez <strong>Réseau Mobile</strong> (ou Données cellulaires) puis <strong>Ajouter une eSIM</strong>.</p>
              </div>
              <div className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                <p className="text-sm text-text-main">Scannez le <strong>QR Code</strong> affiché sur la droite de cet écran.</p>
              </div>
              <div className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                <p className="text-sm text-text-main">Suivez les instructions à l&apos;écran pour finaliser l&apos;activation.</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border-light">
              <h4 className="font-bold text-primary text-sm mb-3">Recevoir par email</h4>
              {mailSent ? (
                <div className="bg-success/10 text-success p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> QR Code envoyé à {email}
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      inputMode="email"
                      placeholder="votre@email.com"
                      className="flex-1 border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setMailError(null); }}
                    />
                    <Button onClick={handleSendMail} disabled={!emailValide || isSendingMail}>
                      {isSendingMail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    </Button>
                  </div>
                  {mailError && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                      {mailError}
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Reçu et QR Code */}
          <Card id="esim-receipt" className="overflow-hidden p-0 print:shadow-none print:border-none flex flex-col">
            <div style={{background: 'linear-gradient(135deg, #1a1464 0%, #2d27a0 60%, #f5a800 100%)'}} className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">Activation</p>
                <h3 className="text-white font-extrabold text-2xl tracking-wide">eSIM N&apos;ma SIM</h3>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs uppercase tracking-widest">Réf</p>
                <p className="text-yellow-300 font-mono font-bold text-sm">{profile.reference}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
              <div className="bg-white p-4 rounded-3xl shadow-lg border-2 border-primary/10 mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(profile.qrString)}`} 
                  alt="eSIM QR Code"
                  className="w-48 h-48 md:w-56 md:h-56 object-contain"
                />
              </div>

              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm border-b border-border-light pb-1">
                  <span className="text-text-muted">Client</span>
                  <span className="font-bold text-primary">{profile.nomClient}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border-light pb-1">
                  <span className="text-text-muted">Dossier</span>
                  <span className="font-mono text-primary">{profile.numeroDossier}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border-light pb-1">
                  <span className="text-text-muted">Expiration</span>
                  <span className="font-bold text-red-500">Dans 48h</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border-t border-border-light p-4 text-center">
              <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Ce QR code est unique et à usage unique.
              </p>
            </div>
          </Card>

        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          <Button variant="outline" className="h-14 bg-white" onClick={handlePrint}>
            <Printer className="w-5 h-5 mr-2" /> Imprimer le QR Code
          </Button>
          <Button
            className="h-14 bg-success hover:bg-success/90"
            onClick={handleTerminer}
          >
            <Home className="w-5 h-5 mr-2" /> Terminer (Retour accueil)
          </Button>
        </div>

      </div>
    </>
  );
}
