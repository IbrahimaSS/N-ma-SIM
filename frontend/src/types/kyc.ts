// ============================================================
// Types TypeScript pour la réponse de l'API IA KYC
// POST http://localhost:8000/kyc (proxied via /api/kyc)
// ⚠️ Les noms de champs correspondent exactement à ce que renvoie
//    le backend FastAPI Python (snake_case).
// ============================================================

/** Décision finale rendue par l'API IA (inclut souvent des emojis ou du texte supplémentaire) */
export type KycDecision = string;

/** Type de pièce d'identité détecté */
export type KycTypePiece = "CNI" | "PASSEPORT" | "CARTE_ELECTEUR" | "PERMIS" | string;

/**
 * Champs extraits de la pièce d'identité via OCR.
 * ⚠️ Nommage snake_case : identique à la sortie du backend Python.
 */
export interface KycChampsExtraits {
  nom?: string;
  prenom?: string;
  /** Format "JJ/MM/AAAA" */
  date_naissance?: string;
  /** Numéro d'identité (16 chiffres CNI, 9 chiffres passeport) */
  numero_identite?: string;
  sexe?: string;
  nationalite?: string;
  /** Format "JJ/MM/AAAA" */
  date_expiration?: string;
  /** Format "JJ/MM/AAAA" */
  date_emission?: string;
  lieu_naissance?: string;
  lieu_delivrance?: string;
  region?: string;
  commune?: string;
  quartier?: string;
  secteur?: string;
  /** NIN (15 chiffres, verso CNI) */
  nin?: string;
  /** Numéro personnel (passeport) */
  numero_personnel?: string;
  /** Autorité (passeport) */
  autorite?: string;
  // Carte d'électeur
  identifiant?: string;
  numero_carte?: string;
  centre_vote?: string;
  bureau_vote?: string;
  adresse?: string;
  prefecture?: string;
  /** Champs supplémentaires inconnus */
  [key: string]: string | undefined;
}

/** Résultat de la reconnaissance faciale (face match) */
export interface KycResultatVisage {
  /** true = même personne, false = différent, null = non évalué */
  verifie: boolean | null;
  /** Similarité ArcFace, 0 à 1 (multiplié par 100 pour affichage %) */
  similarite: number | null;
  seuil?: number;
  erreur?: string | null;
}

/** Résultat du contrôle anti-spoofing (liveness) */
export interface KycLiveness {
  vrai: boolean | null;
  score: number | null;
  erreur?: string | null;
}

/** Réponse complète de l'API IA KYC */
export interface KycReponse {
  decision: KycDecision;
  type_piece?: KycTypePiece;
  age?: number | null;
  cle?: string | null;
  risque?: number | null;
  qualite?: number | null;
  champs?: KycChampsExtraits;
  /** Champ renvoyé par le backend : face (snake_case) */
  face?: KycResultatVisage;
  /** Alias camelCase pour compatibilité frontend */
  visage?: KycResultatVisage;
  liveness_selfie?: KycLiveness;
  liveness_piece?: KycLiveness;
  details?: string[];
  message?: string;
}

/** Erreur structurée retournée par notre proxy backend */
export interface KycError {
  code: "IA_UNAVAILABLE" | "MISSING_FIELDS" | "INVALID_RESPONSE" | "INTERNAL_ERROR";
  message: string;
}

/** Clés de stockage IndexedDB pour les fichiers KYC */
export type KycStorageKey = "kyc_recto" | "kyc_verso" | "kyc_selfie" | "kyc_result";
