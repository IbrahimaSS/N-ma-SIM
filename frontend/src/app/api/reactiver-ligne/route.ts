import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Appelée automatiquement par la borne à la fin d'une réactivation SANS nouvelle carte
 * (le client garde la sienne) : remet le numéro en service (OPS).
 * Réactivation après perte : la nouvelle carte passe par /api/materiel/distribuer-sim.
 */
export async function POST(request: Request) {
  try {
    const { demandeId } = await request.json();
    if (!demandeId) return NextResponse.json({ success: false, error: "demandeId manquant" }, { status: 400 });

    const res = await fetch(`${BACKEND_URL}/api/demandes/${encodeURIComponent(demandeId)}/reactiver-ligne`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-service": "kiosk-borne" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data?.message || "Réactivation impossible" }, { status: res.status });
    }
    return NextResponse.json({ success: true, numero: data.data?.numero });
  } catch (error) {
    console.error("[REACTIVER-LIGNE]", error);
    return NextResponse.json({ success: false, error: "Service de réactivation indisponible" }, { status: 502 });
  }
}
