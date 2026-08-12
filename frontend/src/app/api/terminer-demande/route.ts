import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Route proxy : appelée par la borne quand le client clique sur "Terminer".
 * Elle met à jour le statut de la demande à VALIDEE dans le backend admin.
 */
export async function POST(request: Request) {
  try {
    const { demandeId } = await request.json();

    if (!demandeId) {
      return NextResponse.json({ error: "demandeId manquant" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/demandes/${demandeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // Token système interne — la borne a accès sans login agent
        "Authorization": `Bearer ${process.env.KIOSK_SYSTEM_TOKEN || "kiosk-system"}`,
      },
      body: JSON.stringify({
        statut: "VALIDEE",
        commentaireAdmin: "Validation automatique borne libre-service.",
        verificationOCR: true,
        verificationSelfie: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[TERMINER] Erreur backend:", err);
      // On ne bloque pas l'utilisateur — on log et on continue
      return NextResponse.json({ success: false, error: "Erreur mise à jour statut" }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, demande: data.data });

  } catch (error) {
    console.error("[TERMINER ERROR]", error);
    // Graceful degradation — ne pas bloquer la navigation
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 200 });
  }
}
