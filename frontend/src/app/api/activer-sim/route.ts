import { NextResponse } from "next/server";
import { lireCarteDelivree } from "@/lib/materiel/lecteur-carte";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

// Le lecteur de carte est un équipement de la borne : runtime Node (comme le distributeur)
export const runtime = "nodejs";

/**
 * Appelée automatiquement par la borne juste après la sortie de la carte :
 * lit l'IMSI de la carte délivrée, puis le backend crée et active la ligne (OPS)
 * et renvoie le numéro attribué. Aucune action du client.
 */
export async function POST(request: Request) {
  try {
    const { demandeId } = await request.json();
    if (!demandeId) return NextResponse.json({ success: false, error: "demandeId manquant" }, { status: 400 });

    const carte = await lireCarteDelivree();
    if (carte.simulee) console.log(`[ACTIVER-SIM] Lecteur simulé : IMSI ${carte.imsi}`);

    const res = await fetch(`${BACKEND_URL}/api/demandes/${encodeURIComponent(demandeId)}/activer-sim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-service": "kiosk-borne" },
      body: JSON.stringify({ imsi: carte.imsi }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data?.message || "Activation impossible" }, { status: res.status });
    }
    return NextResponse.json({ success: true, numero: data.data?.numero });
  } catch (error) {
    console.error("[ACTIVER-SIM]", error);
    const message = error instanceof Error ? error.message : "Service d'activation indisponible";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
