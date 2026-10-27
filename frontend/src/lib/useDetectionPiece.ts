"use client";
import { useCallback, useRef, useState } from "react";
import { verifierKYC } from "@/lib/kyc.client";
import type { KycReponse } from "@/types/kyc";

/**
 * Détection automatique du type de pièce d'identité à partir du recto : le client ne choisit
 * plus son type, le moteur KYC le reconnaît (mots-clés + MRZ) et la borne demande ensuite
 * seulement les faces utiles. Après ECHECS_AVANT_CHOIX pièces non reconnues, le choix manuel
 * réapparaît en secours pour ne jamais bloquer le client.
 */
export type TypePiece = "cni" | "passeport" | "carte_electeur" | "permis";

/** Verso selon la pièce : électeur = recto seul, CNI / permis = recto + verso, passeport = verso facultatif */
export const REGLE_VERSO: Record<TypePiece, "aucun" | "obligatoire" | "facultatif"> = {
  carte_electeur: "aucun",
  cni: "obligatoire",
  permis: "obligatoire",
  passeport: "facultatif",
};

const DEPUIS_KYC: Record<string, TypePiece> = {
  CNI: "cni", PASSEPORT: "passeport", CARTE_ELECTEUR: "carte_electeur", PERMIS: "permis",
};

export const ECHECS_AVANT_CHOIX = 2;

export type EtatDetection = "attente" | "en-cours" | "reconnue" | "inconnue" | "refusee" | "erreur";

export function libelleTypePiece(type: TypePiece, lang: string): string {
  const en = lang === "en";
  return { cni: en ? "National ID card" : "Carte d'identité", passeport: en ? "Passport" : "Passeport",
    carte_electeur: en ? "Voter ID" : "Carte d'électeur", permis: en ? "Biometric licence" : "Permis biométrique" }[type];
}

export function useDetectionPiece({ lang, etranger }: { lang: string; etranger: boolean }) {
  const [type, setType] = useState<TypePiece | null>(null);
  const [etat, setEtat] = useState<EtatDetection>("attente");
  const [echecs, setEchecs] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [manuel, setManuel] = useState(false);
  // Analyse du recto seul : réutilisée telle quelle si aucun verso n'est ajouté (évite un 2e appel)
  const resultatRecto = useRef<KycReponse | null>(null);
  const appel = useRef(0);
  const en = lang === "en";

  const echec = useCallback((texte: string, etatEchec: EtatDetection) => {
    setType(null);
    setEtat(etatEchec);
    setMessage(texte);
    setEchecs((n) => n + 1);
  }, []);

  /** Analyse le recto pour reconnaître la pièce ; renvoie le type reconnu (ou null).
   *  Un type choisi à la main n'est pas remplacé. */
  const detecter = useCallback(async (recto: File): Promise<TypePiece | null> => {
    resultatRecto.current = null;
    if (manuel) return type;
    const id = ++appel.current;
    setEtat("en-cours");
    setMessage(null);
    try {
      const resultat = await verifierKYC(recto);
      if (id !== appel.current) return null; // un autre recto a été posé entre-temps
      const reconnu = DEPUIS_KYC[String(resultat.type_piece || "").toUpperCase()] ?? null;
      if (!reconnu) {
        echec(en ? "Document not recognised. Place it flat on the glass and scan the front again."
          : "Pièce non reconnue. Posez-la bien à plat sur la vitre et rescannez le recto.", "inconnue");
        return null;
      }
      if (etranger && reconnu !== "passeport") {
        echec(en ? "For foreign nationals, only a passport is accepted."
          : "Pour les étrangers, seul le passeport est accepté.", "refusee");
        return null;
      }
      resultatRecto.current = resultat;
      setType(reconnu);
      setEtat("reconnue");
      return reconnu;
    } catch {
      if (id !== appel.current) return null;
      echec(en ? "The document could not be analysed. Please scan the front again."
        : "La pièce n'a pas pu être analysée. Rescannez le recto.", "erreur");
      return null;
    }
  }, [manuel, type, etranger, en, echec]);

  /** Secours après plusieurs échecs : le client indique lui-même son type de pièce. */
  const choisir = useCallback((t: TypePiece) => {
    appel.current++;
    resultatRecto.current = null;
    setManuel(true);
    setType(t);
    setEtat("reconnue");
    setMessage(null);
  }, []);

  /** Nouvelle pièce : tout recommencer (le choix manuel reste proposé si on y était passé). */
  const reinitialiser = useCallback(() => {
    appel.current++;
    resultatRecto.current = null;
    setType(null);
    setEtat("attente");
    setMessage(null);
    setManuel(false);
  }, []);

  return {
    type,
    etat,
    message,
    regleVerso: type ? REGLE_VERSO[type] : null,
    choixManuelPropose: echecs >= ECHECS_AVANT_CHOIX,
    resultatRecto,
    detecter,
    choisir,
    reinitialiser,
  };
}
