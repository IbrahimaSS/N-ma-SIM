/**
 * Une seule demande back-office par parcours client, même si l'écran est rechargé
 * (ex. router.push("?success=true") qui remonte le composant et vide ses refs).
 * Conservée en sessionStorage, vidé entre deux clients par resetKioskSession().
 */
const CLE = "kiosk_demande";

export interface DemandeSoumise {
  numeroDossier?: string;
  demandeId?: string;
}

export function lireDemandeSoumise(): DemandeSoumise | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as DemandeSoumise) : null;
  } catch {
    return null;
  }
}

export function memoriserDemande(demande: DemandeSoumise): void {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(demande));
  } catch {
    // sessionStorage indisponible : on garde la protection en mémoire de l'écran.
  }
}
