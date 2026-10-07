import type { KycReponse } from "@/types/kyc";

/** Garde-fou de délivrance : seule une identité "ACCEPTÉ" par le KYC peut recevoir une SIM. */
export function identiteValidee(result: KycReponse | null | undefined): boolean {
  return (result?.decision ?? "").toUpperCase().includes("ACCEPTÉ");
}

export type VerdictSelfie =
  | { valide: true }
  | { valide: false; message: string; relancerCamera: boolean };

/**
 * Interprète la décision KYC rendue après l'envoi du selfie.
 * Fail-closed : seule une décision "ACCEPTÉ" valide l'identité. Toute autre
 * décision (REJETÉ, REPRENDRE_PHOTO, REPRENDRE LE SELFIE, statut inconnu)
 * bloque — l'API peut renvoyer un statut sans "REJETÉ" alors que le visage
 * n'a pas été validé (lecture MRZ échouée avant la comparaison faciale, ou
 * tentatives de selfie restantes).
 */
export function interpreterDecisionSelfie(result: KycReponse): VerdictSelfie {
  const decision = (result.decision ?? "").toUpperCase();
  const details = result.details ?? [];

  if (identiteValidee(result)) return { valide: true };

  if (decision.includes("REPRENDRE LE SELFIE")) {
    return {
      valide: false,
      message:
        "Visage non concordant. Le selfie ne correspond pas à la photo de votre pièce d'identité. Veuillez reprendre votre selfie.",
      relancerCamera: true,
    };
  }

  if (decision.includes("REPRENDRE_PHOTO")) {
    return {
      valide: false,
      message:
        "La photo de votre pièce d'identité n'est pas assez lisible pour vérifier votre identité (pour une CNI ou un passeport, le verso avec la bande de caractères est nécessaire). Veuillez recommencer le scan de votre pièce.",
      relancerCamera: false,
    };
  }

  if (decision.includes("REJETÉ")) {
    const noFace = details.some((d) => d.toLowerCase().includes("aucun visage"));
    const mismatch = details.some((d) => d.toLowerCase().includes("visage non concordant"));
    return {
      valide: false,
      message: noFace
        ? "Aucun visage détecté sur le selfie. Positionnez-vous face à la caméra."
        : mismatch
        ? "Visage non concordant. Le selfie ne correspond pas à la photo sur votre pièce d'identité. Veuillez reprendre votre selfie."
        : `Vérification refusée : ${details[0] || "veuillez contacter un agent."}`,
      relancerCamera: noFace || mismatch,
    };
  }

  return {
    valide: false,
    message: `Vérification incomplète : ${result.message || result.decision || "veuillez contacter un agent."}`,
    relancerCamera: false,
  };
}
