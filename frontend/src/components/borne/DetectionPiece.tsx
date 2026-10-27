"use client";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { libelleTypePiece, type EtatDetection, type TypePiece } from "@/lib/useDetectionPiece";

interface DetectionPieceProps {
  lang: string;
  etat: EtatDetection;
  type: TypePiece | null;
  message: string | null;
  regleVerso: "aucun" | "obligatoire" | "facultatif" | null;
  choixManuelPropose: boolean;
  onChoisir: (type: TypePiece) => void;
}

/** Résultat de la reconnaissance automatique de la pièce + choix manuel de secours. */
export function DetectionPiece({ lang, etat, type, message, regleVerso, choixManuelPropose, onChoisir }: DetectionPieceProps) {
  const en = lang === "en";
  const consigneVerso =
    regleVerso === "obligatoire" ? (en ? "Now scan the back." : "Scannez maintenant le verso.")
    : regleVerso === "facultatif" ? (en ? "Back is optional: scan it or start the extraction." : "Verso facultatif : scannez-le ou lancez l'extraction.")
    : regleVerso === "aucun" ? (en ? "Front only: no back needed." : "Recto seul : pas de verso à scanner.")
    : null;

  return (
    <div className="mb-5 flex flex-col gap-3">
      {etat === "en-cours" && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 text-primary font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          {en ? "Recognising your document..." : "Reconnaissance de la pièce..."}
        </div>
      )}

      {etat === "reconnue" && type && (
        <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl p-4">
          <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
          <div>
            <p className="font-bold text-success">{libelleTypePiece(type, lang)} {en ? "detected" : "détectée"}</p>
            {consigneVerso && <p className="text-sm text-success/80">{consigneVerso}</p>}
          </div>
        </div>
      )}

      {(etat === "inconnue" || etat === "refusee" || etat === "erreur") && message && (
        <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4">
          <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-700">{message}</p>
        </div>
      )}

      {/* Secours : après plusieurs pièces non reconnues, le client choisit son type */}
      {choixManuelPropose && !type && etat !== "en-cours" && (
        <div className="border border-border-light rounded-xl p-4 bg-gray-50">
          <p className="font-bold text-text-main text-sm mb-1">{en ? "Choose your document type" : "Choisissez votre type de pièce"}</p>
          <p className="text-xs text-text-muted mb-3">
            {en ? "We could not recognise your document automatically." : "Nous n'avons pas pu reconnaître votre pièce automatiquement."}
          </p>
          <div className="flex gap-3 flex-wrap">
            {(["cni", "passeport", "carte_electeur", "permis"] as TypePiece[]).map((t) => (
              <button
                key={t}
                data-ai-action={t === "cni" ? "btn-cni" : t === "passeport" ? "btn-passeport" : t === "carte_electeur" ? "btn-electeur" : "btn-permis"}
                onClick={() => onChoisir(t)}
                className="px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white text-text-main border-border-light hover:border-primary hover:text-primary transition-colors"
              >
                {libelleTypePiece(t, lang)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
