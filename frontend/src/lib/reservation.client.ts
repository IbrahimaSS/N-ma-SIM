/**
 * SIM réservée (voyageur) : code reçu avec la réservation d'hôtel → récupération à la borne.
 * La réservation en cours est gardée en sessionStorage (vidée entre deux clients par resetKioskSession).
 */
const CLE = "kiosk_reservation";

export interface ReservationBorne {
  code: string;
  prenom: string;
  nomInitiale: string;
  formatSim: "PHYSIQUE" | "ESIM";
  offre: { id: string; nom: string; type: string; prix: number; data?: string | null; appels?: string | null; sms?: string | null; duree?: string | null } | null;
  montantRecharge: number | null;
  partenaireNom: string;
  expireLe: string;
}

export function lireReservation(): ReservationBorne | null {
  try {
    const brut = sessionStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as ReservationBorne) : null;
  } catch {
    return null;
  }
}

export function ecrireReservation(r: ReservationBorne): void {
  try { sessionStorage.setItem(CLE, JSON.stringify(r)); } catch { /* sessionStorage indisponible */ }
}

/** Vérifie un code (et, si fourni, que le passeport scanné correspond). Lève une Error lisible. */
export async function verifierReservation(code: string, numeroPasseport?: string): Promise<ReservationBorne> {
  const res = await fetch("/api/reservation/verifier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(numeroPasseport !== undefined ? { code, numeroPasseport } : { code }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Impossible de vérifier ce code.");
  return data.data as ReservationBorne;
}

/** Libellé du produit réservé (« SIM physique + recharge 10 000 GNF », « eSIM — Pass 5 Go »…). */
export function libelleProduit(r: ReservationBorne, lang: string): string {
  const en = lang === "en";
  const base = r.formatSim === "ESIM" ? "eSIM" : (en ? "Physical SIM" : "SIM physique");
  const extras: string[] = [];
  if (r.offre) extras.push(r.offre.nom);
  if (r.montantRecharge) extras.push(`${en ? "top-up" : "recharge"} ${r.montantRecharge.toLocaleString("fr-FR")} GNF`);
  return extras.length ? `${base} — ${extras.join(" + ")}` : base;
}

/**
 * Remplit les étapes « offre » et « paiement » du parcours avec la réservation (déjà payée),
 * pour que les pages suivantes (reçu, génération eSIM) et leurs gardes fonctionnent sans paiement.
 * Le montant réel est fixé côté serveur à partir de la réservation.
 */
export function preparerReservationPrepayee(r: ReservationBorne): void {
  try {
    sessionStorage.setItem("kiosk_offer", JSON.stringify({
      id: r.offre?.id || "aucune",
      titre: r.offre?.nom || "SIM réservée",
      description: `Réservation ${r.code} — ${r.partenaireNom}`,
      prixGNF: 0,
      type: r.offre?.type || "AUCUNE",
    }));
    sessionStorage.setItem("kiosk_payment", JSON.stringify({
      method: `Payé par réservation (${r.partenaireNom})`,
      reference: r.code,
    }));
  } catch { /* sessionStorage indisponible */ }
}
