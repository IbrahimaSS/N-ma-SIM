import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * GET /api/public/parametres
 * Route publique (sans auth) pour récupérer les paramètres utilisés
 * par les bornes (tarifs, etc.) depuis le backend.
 * Renvoie uniquement les clés utiles à la borne.
 */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parametres`, {
      method: "GET",
      headers: {
        // Pas de token : le backend doit exposer ces données en public
        // ou on utilise un token de service interne
        "x-internal-service": "kiosk-borne",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // Si le backend retourne une erreur, on retourne les valeurs par défaut
      return NextResponse.json({
        tarif_reactivation: 10000,
        tarif_nouvelle_sim: 10000,
      });
    }

    const raw = await res.json();
    // Extraire uniquement les données utiles à la borne (pas d'infos sensibles)
    const data = raw?.data ?? raw ?? {};
    return NextResponse.json({
      tarif_reactivation: Number(data.tarif_reactivation ?? data["Tarif réactivation"] ?? 10000),
      tarif_nouvelle_sim: Number(data.tarif_nouvelle_sim ?? data["Tarif nouvelle SIM"] ?? 10000),
    });
  } catch {
    // Fallback sur les valeurs par défaut si le backend est inaccessible
    return NextResponse.json({
      tarif_reactivation: 10000,
      tarif_nouvelle_sim: 10000,
    });
  }
}
