import { NextResponse } from "next/server";
import { scannerDocument } from "@/lib/materiel/scanner";

// spawn(powershell) nécessite le runtime Node (pas edge).
export const runtime = "nodejs";

export async function POST() {
  try {
    const buffer = await scannerDocument();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[SCANNER]", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
