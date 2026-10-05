import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Route proxy : enregistre le choix du client (fait sur l'écran de confirmation
 * finale) d'activer ou non un compte Orange Money sur son nouveau numéro.
 * Ne crée pas réellement le compte (pas d'API Orange disponible) — capture
 * juste l'intention pour que le back-office puisse la traiter.
 */
export async function POST(request: Request) {
  try {
    const { demandeId, souhaite } = await request.json();

    if (!demandeId || typeof souhaite !== "boolean") {
      return NextResponse.json({ error: "demandeId ou souhaite manquant/invalide" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/demandes/${demandeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service": "kiosk-borne",
      },
      body: JSON.stringify({ compteOrangeMoney: souhaite }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[ACTIVER-COMPTE-OM] Erreur backend:", err);
      // On ne bloque jamais la fin du parcours client pour ce choix annexe
      return NextResponse.json({ success: false }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ACTIVER-COMPTE-OM ERROR]", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
