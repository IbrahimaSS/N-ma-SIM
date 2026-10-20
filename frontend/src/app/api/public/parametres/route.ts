import { NextResponse } from "next/server";
import { PRIX_NOUVELLE_SIM, PRIX_REACTIVATION } from "@/lib/tarifs";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const DEFAUT = { tarif_reactivation: PRIX_REACTIVATION, tarif_nouvelle_sim: PRIX_NOUVELLE_SIM };

/**
 * GET /api/public/parametres
 * Tarifs de la borne, réglés par l'administrateur (Admin → Paramètres → Paiements).
 * Lecture seule ; valeurs par défaut si le backend ne répond pas.
 */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parametres/tarifs`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json(DEFAUT);

    const raw = await res.json();
    const data = raw?.data ?? raw ?? {};
    const lire = (v: unknown, defaut: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : defaut;
    };
    return NextResponse.json({
      tarif_reactivation: lire(data.tarif_reactivation, PRIX_REACTIVATION),
      tarif_nouvelle_sim: lire(data.tarif_nouvelle_sim, PRIX_NOUVELLE_SIM),
    });
  } catch {
    return NextResponse.json(DEFAUT);
  }
}
