import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * POST /api/reservation/verifier — proxy borne → backend (code seul, ou code + passeport).
 * Transmet l'adresse de la borne pour que la limite d'essais s'applique par borne.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const res = await fetch(`${BACKEND_URL}/api/reservations/verifier`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ip ? { "x-forwarded-for": ip } : {}) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ message: "Réponse invalide du serveur." }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: "Serveur injoignable. Réessayez dans un instant." }, { status: 503 });
  }
}
