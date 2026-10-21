import { NextResponse } from "next/server";
import { lireCarteDelivree } from "@/lib/materiel/lecteur-carte";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// Le lecteur de carte est un équipement de la borne : runtime Node (comme le distributeur)
export const runtime = "nodejs";

/**
 * Appelée automatiquement par la borne à la fin d'une réactivation : remet le numéro en service (OPS).
 * nouvelleCarte = true (motif perte) → une carte vient d'être délivrée, on lit son IMSI.
 */
export async function POST(request: Request) {
  try {
    const { demandeId, nouvelleCarte } = await request.json();
    if (!demandeId) return NextResponse.json({ success: false, error: "demandeId manquant" }, { status: 400 });

    let imsi: string | undefined;
    if (nouvelleCarte) {
      const carte = await lireCarteDelivree();
      if (carte.simulee) console.log(`[REACTIVER-LIGNE] Lecteur simulé : IMSI ${carte.imsi}`);
      imsi = carte.imsi;
    }

    const res = await fetch(`${BACKEND_URL}/api/demandes/${encodeURIComponent(demandeId)}/reactiver-ligne`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-service": "kiosk-borne" },
      body: JSON.stringify(imsi ? { imsi } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data?.message || "Réactivation impossible" }, { status: res.status });
    }
    return NextResponse.json({ success: true, numero: data.data?.numero });
  } catch (error) {
    console.error("[REACTIVER-LIGNE]", error);
    const message = error instanceof Error ? error.message : "Service de réactivation indisponible";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
