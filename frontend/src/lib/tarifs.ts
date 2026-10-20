/**
 * Tarifs de la borne N'ma SIM (GNF).
 * Les prix sont réglés par l'administrateur (Admin → Paramètres → Paiements → Tarifs de la borne).
 * Les valeurs ci-dessous ne servent que si le serveur ne répond pas.
 */
export const PRIX_NOUVELLE_SIM = 5000;
export const PRIX_REACTIVATION = 3000;

export interface Tarifs {
  nouvelleSim: number;
  reactivation: number;
}

/** Charge les tarifs réglés par l'administrateur (repli sur les valeurs par défaut). */
export async function chargerTarifs(): Promise<Tarifs> {
  try {
    const res = await fetch("/api/public/parametres", { cache: "no-store" });
    const data = await res.json();
    return {
      nouvelleSim: Number(data?.tarif_nouvelle_sim) > 0 ? Number(data.tarif_nouvelle_sim) : PRIX_NOUVELLE_SIM,
      reactivation: Number(data?.tarif_reactivation) > 0 ? Number(data.tarif_reactivation) : PRIX_REACTIVATION,
    };
  } catch {
    return { nouvelleSim: PRIX_NOUVELLE_SIM, reactivation: PRIX_REACTIVATION };
  }
}
