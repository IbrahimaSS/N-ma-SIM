import { NextRequest, NextResponse } from "next/server";
import { scannerPiece, type TypePiece } from "@/lib/materiel/scanner";

// spawn(powershell) / appel de l'API locale nécessitent le runtime Node (pas edge).
export const runtime = "nodejs";

const TYPES: TypePiece[] = ["cni", "passeport", "carte_electeur", "permis"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const typePiece = TYPES.includes(body?.typePiece) ? (body.typePiece as TypePiece) : undefined;
  try {
    const { image, decoupe } = await scannerPiece(typePiece);
    return new NextResponse(new Uint8Array(image), {
      status: 200,
      headers: { "Content-Type": "image/jpeg", "X-Decoupe": decoupe ? "oui" : "non" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[SCANNER]", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
