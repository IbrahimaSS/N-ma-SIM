"use client";
import { useState } from "react";
import { Wallet, Check, X, Loader2 } from "lucide-react";

interface OrangeMoneyChoiceProps {
  demandeId: string | null;
  lang?: string;
}

/**
 * Écran de confirmation finale (reçu physique ou QR eSIM) : laisse le client
 * choisir s'il veut activer Orange Money sur son nouveau numéro. Ne crée pas
 * réellement le compte (pas d'API Orange branchée) — enregistre juste
 * l'intention sur la demande pour que le back-office la traite.
 */
export function OrangeMoneyChoice({ demandeId, lang = "fr" }: OrangeMoneyChoiceProps) {
  const [choice, setChoice] = useState<"oui" | "non" | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleChoice = async (souhaite: boolean) => {
    if (!demandeId || choice) return;
    setChoice(souhaite ? "oui" : "non");
    setIsSending(true);
    try {
      await fetch("/api/activer-compte-om", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandeId, souhaite }),
      });
    } catch (e) {
      console.error("[OM CHOICE]", e);
    } finally {
      setIsSending(false);
    }
  };

  if (!demandeId) return null;

  return (
    <div className="print:hidden bg-white border border-border-light rounded-2xl p-5 mb-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
        <Wallet className="w-6 h-6 text-orange-600" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="font-bold text-primary">
          {lang === "en" ? "Activate Orange Money on this number?" : "Activer Orange Money sur ce numéro ?"}
        </p>
        <p className="text-sm text-text-muted">
          {lang === "en" ? "Optional — you can also do this later." : "Facultatif — vous pourrez aussi le faire plus tard."}
        </p>
      </div>
      {choice ? (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm flex-shrink-0 ${choice === "oui" ? "bg-success/10 text-success" : "bg-gray-100 text-text-muted"}`}>
          {choice === "oui" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {choice === "oui"
            ? (lang === "en" ? "Noted, thank you!" : "C'est noté, merci !")
            : (lang === "en" ? "No problem" : "Pas de souci")}
        </div>
      ) : (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => handleChoice(false)}
            disabled={isSending}
            className="px-4 py-2 rounded-xl border border-border-light text-text-muted font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            {lang === "en" ? "No thanks" : "Non merci"}
          </button>
          <button
            onClick={() => handleChoice(true)}
            disabled={isSending}
            className="px-5 py-2 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {lang === "en" ? "Yes, activate" : "Oui, activer"}
          </button>
        </div>
      )}
    </div>
  );
}
