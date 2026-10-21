import { NextResponse } from "next/server";
import { distribuerCarte, ErreurActivation } from "@/lib/materiel/distributeur";
import { ErreurSKAD3, ErreurCommunication } from "@/lib/materiel/skad3";

// serialport nécessite le runtime Node (pas edge).
export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// Opération chez l'opérateur selon le service : nouvelle ligne, ou remise en service du numéro (perte)
const ROUTES = { "nouvelle-sim": "activer-sim", reactivation: "reactiver-ligne" } as const;

/**
 * Délivre une carte SIM ACTIVE, sans action du client :
 * SK-AD3 → carte au lecteur → ICCID + IMSI lus → ligne activée chez l'opérateur (backend / OPS)
 * → carte présentée au client. Lecture ou activation refusée → carte au bac de capture.
 */
export async function POST(request: Request) {
  try {
    const { demandeId, service } = await request.json();
    const route = ROUTES[service as keyof typeof ROUTES];
    if (!demandeId || !route) {
      return NextResponse.json({ success: false, message: "demandeId et service (nouvelle-sim | reactivation) requis" }, { status: 400 });
    }

    const { carte, resultat } = await distribuerCarte(async (carte) => {
      const res = await fetch(`${BACKEND_URL}/api/demandes/${encodeURIComponent(demandeId)}/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-service": "kiosk-borne" },
        body: JSON.stringify({ imsi: carte.imsi, iccid: carte.iccid }),
      });
      const data = await res.json().catch(() => ({}));
      // 409 = cette carte précise est refusée (déjà attribuée / déjà active) → carte suivante
      if (!res.ok) throw new ErreurActivation(data?.message || "Activation refusée par l'opérateur", res.status === 409);
      return data.data as { numero?: string };
    });

    return NextResponse.json({ success: true, numero: resultat?.numero, iccid: carte.iccid });
  } catch (error) {
    console.error("[DISTRIBUER-SIM]", error);
    const message =
      error instanceof ErreurSKAD3 && error.code === "A0" ? "Plus de carte SIM disponible dans la borne."
      : error instanceof ErreurSKAD3 && error.code === "10" ? "Carte coincée dans le distributeur."
      : error instanceof ErreurCommunication ? "Le distributeur de cartes ne répond pas."
      : error instanceof Error ? error.message
      : "La carte n'a pas pu être délivrée.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
