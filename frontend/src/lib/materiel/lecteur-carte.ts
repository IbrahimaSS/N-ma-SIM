import { randomInt } from "crypto";

/**
 * Lecture de l'IMSI de la carte SIM qui vient de sortir du distributeur, sans action du client.
 * Sur les cartes Orange, l'IMSI (10 chiffres) est imprimé au dos et encodé dans un code-barres Code 128.
 *
 * SIM_LECTEUR_CARTE (.env.local) :
 *   "simulation" (défaut) → IMSI fictif au format Orange, tant que le lecteur n'est pas installé
 *   autre valeur          → lecteur physique (à brancher quand le matériel sera choisi)
 */
export interface CarteLue {
  imsi: string;
  simulee: boolean;
}

export async function lireCarteDelivree(): Promise<CarteLue> {
  const mode = process.env.SIM_LECTEUR_CARTE || "simulation";
  if (mode === "simulation") {
    // Même forme que les cartes du stock (ex. 2062359768) : 20 + 8 chiffres
    return { imsi: `20${String(randomInt(0, 100_000_000)).padStart(8, "0")}`, simulee: true };
  }
  throw new Error(`Lecteur de carte « ${mode} » non pris en charge : aucun lecteur physique n'est encore branché.`);
}
