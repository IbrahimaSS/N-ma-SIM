/** Résultat KYC tel que transmis par la borne aux routes de soumission. */
export interface KycTransmis {
  decision?: string;
  champs?: Record<string, unknown>;
  face?: { verifie?: boolean | null; similarite?: number | null } | null;
  visage?: { verifie?: boolean | null; similarite?: number | null } | null;
}

export interface ChampsVerification {
  scoreVerification?: number;
  verificationOCR?: boolean;
  verificationSelfie?: boolean;
}

/**
 * Champs "Résultat N'ma SIM" de la demande (back-office), déduits du résultat KYC.
 * Les valeurs inconnues sont omises : le backend les accepte facultatives, pas nulles.
 * - verificationOCR    : nom, prénom et date de naissance lus sur la pièce ;
 * - verificationSelfie : verdict de la comparaison du selfie avec la photo de la pièce ;
 * - scoreVerification  : similarité faciale, en pourcentage.
 */
export function champsVerificationKyc(kyc: KycTransmis | null | undefined): ChampsVerification {
  if (!kyc) return {};
  const resultat: ChampsVerification = {};
  const champs = kyc.champs ?? {};
  resultat.verificationOCR = Boolean(champs.nom && champs.prenom && champs.date_naissance);
  const visage = kyc.face ?? kyc.visage;
  if (typeof visage?.verifie === "boolean") resultat.verificationSelfie = visage.verifie;
  if (typeof visage?.similarite === "number") resultat.scoreVerification = Math.round(visage.similarite * 100);
  return resultat;
}
