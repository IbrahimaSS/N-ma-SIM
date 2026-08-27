/**
 * Sécurité du parcours borne (kiosque) : empêche qu'un parcours client (KYC, paiement...)
 * reste accessible après un changement d'onglet, une inactivité prolongée, ou un accès direct
 * à une étape avancée par URL sans être passé par les étapes précédentes.
 */

/** Vide toutes les données de session du parcours (sessionStorage + fichiers KYC en IndexedDB). */
export async function resetKioskSession(): Promise<void> {
  try {
    sessionStorage.clear();
  } catch {
    // sessionStorage indisponible (mode privé strict) — on continue quand même.
  }
  try {
    const { clearAllKycData } = await import("@/lib/kyc.storage");
    await clearAllKycData();
  } catch {
    // IndexedDB indisponible — sessionStorage est déjà vidé, on ignore.
  }
}

/**
 * Table des dépendances entre étapes : pour chaque route protégée, la clé sessionStorage
 * qui prouve que l'étape précédente a bien été complétée, et la route de repli si absente.
 */
export const KIOSK_STEP_REQUIREMENTS: Record<string, { key: string; fallback: string }> = {
  // ── Nouvelle SIM ──
  "/borne/nouvelle-sim/confirmation-infos": { key: "kiosk_doc_type", fallback: "/borne/nouvelle-sim/scan-piece" },
  "/borne/nouvelle-sim/selfie": { key: "kiosk_client_info", fallback: "/borne/nouvelle-sim/scan-piece" },
  "/borne/nouvelle-sim/offres": { key: "kiosk_selfie_ok", fallback: "/borne/nouvelle-sim/scan-piece" },
  "/borne/nouvelle-sim/paiement": { key: "kiosk_offer", fallback: "/borne/nouvelle-sim/offres" },
  "/borne/nouvelle-sim/recu": { key: "kiosk_payment", fallback: "/borne/nouvelle-sim/offres" },

  // ── Réactivation ──
  "/borne/reactivation/piece-identite": { key: "reactivation_numero", fallback: "/borne/reactivation/identification" },
  "/borne/reactivation/selfie": { key: "kyc_champs", fallback: "/borne/reactivation/identification" },
  "/borne/reactivation/verification": { key: "kiosk_selfie_ok_reactivation", fallback: "/borne/reactivation/identification" },
  "/borne/reactivation/paiement": { key: "reactivation_verified_ok", fallback: "/borne/reactivation/identification" },
  "/borne/reactivation/recu": { key: "ticket_ref", fallback: "/borne/reactivation/identification" },

  // ── Recharge ──
  "/borne/recharge/montant": { key: "recharge_numero", fallback: "/borne/recharge/numero" },
  "/borne/recharge/paiement": { key: "recharge_montant", fallback: "/borne/recharge/numero" },

  // ── Vérification de profil ──
  "/borne/verification/selfie": { key: "kiosk_verif_scan_ok", fallback: "/borne/verification/scan-piece" },
  "/borne/verification/resultat": { key: "kiosk_verif_selfie_ok", fallback: "/borne/verification/scan-piece" },
};
