import { NextRequest, NextResponse } from "next/server";
import { MAXIT_APP_STORE_URL, MAXIT_PLAY_STORE_URL } from "@/lib/maxit-links";

// Redirection automatique iOS/Android à partir du User-Agent.
// ⚠️ Utile seulement si cette route est joignable publiquement par le téléphone du client
// (donc pas en IP LAN privée — voir NEXT_PUBLIC_KIOSK_BASE_URL). Le QR affiché sur la borne
// pointe directement vers Google Play (voir SuccessScreen.tsx) tant qu'il n'y a pas de domaine public.
export async function GET(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  return NextResponse.redirect(isIOS ? MAXIT_APP_STORE_URL : MAXIT_PLAY_STORE_URL);
}
