import { NextResponse } from "next/server";
import { ejecterPuce } from "@/lib/materiel/dispenser";

// serialport nécessite le runtime Node (pas edge).
export const runtime = "nodejs";

export async function POST() {
  try {
    await ejecterPuce();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[EJECTER-PUCE]", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
