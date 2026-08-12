import { NextRequest, NextResponse } from "next/server";
import type { KycReponse, KycError } from "@/types/kyc";

/**
 * POST /api/kyc
 *
 * Proxy sécurisé entre le frontend et l'API IA KYC FastAPI.
 * Le frontend ne connaît jamais l'URL de l'API IA.
 *
 * FormData attendu :
 *   - recto  : File  (obligatoire) — recto de la pièce d'identité
 *   - selfie : File  (obligatoire) — selfie du client
 *   - verso  : File  (optionnel)   — verso de la pièce si CNI
 */
export async function POST(request: NextRequest): Promise<NextResponse<KycReponse | KycError>> {
  const iaApiUrl = process.env.IA_API_URL;

  if (!iaApiUrl) {
    return NextResponse.json<KycError>(
      { code: "INTERNAL_ERROR", message: "URL de l'API IA non configurée." },
      { status: 500 }
    );
  }

  // Récupérer le FormData envoyé par le frontend
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json<KycError>(
      { code: "INTERNAL_ERROR", message: "Impossible de lire le FormData." },
      { status: 400 }
    );
  }

  const recto = formData.get("recto");
  const selfie = formData.get("selfie");
  const verso = formData.get("verso");

  // Validation des champs obligatoires
  if (!recto || !(recto instanceof Blob)) {
    return NextResponse.json<KycError>(
      { code: "MISSING_FIELDS", message: "Le champ 'recto' est obligatoire." },
      { status: 400 }
    );
  }

  // Construire le FormData pour l'API IA
  const iaFormData = new FormData();
  iaFormData.append("recto", recto, (recto as File).name || "recto.jpg");
  
  if (selfie && selfie instanceof Blob) {
    iaFormData.append("selfie", selfie, (selfie as File).name || "selfie.jpg");
  }

  if (verso && verso instanceof Blob) {
    iaFormData.append("verso", verso, (verso as File).name || "verso.jpg");
  }

  // Appel à l'API IA KYC
  let iaResponse: Response;
  try {
    iaResponse = await fetch(`${iaApiUrl}/kyc`, {
      method: "POST",
      body: iaFormData,
      // Pas de Content-Type manuel : fetch le génère automatiquement avec le boundary
    });
  } catch (networkError) {
    console.error("[KYC PROXY] Impossible de joindre l'API IA :", networkError);
    return NextResponse.json<KycError>(
      {
        code: "IA_UNAVAILABLE",
        message: "L'API d'analyse IA est actuellement indisponible. Veuillez réessayer.",
      },
      { status: 503 }
    );
  }

  // Parser la réponse de l'API IA
  let iaData: unknown;
  try {
    iaData = await iaResponse.json();
  } catch {
    console.error("[KYC PROXY] Réponse IA non parsable.");
    return NextResponse.json<KycError>(
      { code: "INVALID_RESPONSE", message: "Réponse invalide reçue de l'API IA." },
      { status: 502 }
    );
  }

  if (!iaResponse.ok) {
    // Tenter de lire le détail d'erreur FastAPI (champ "detail")
    let errorMessage = "L'API IA a retourné une erreur.";
    try {
      const errorDetail = (iaData as { detail?: string })?.detail;
      if (errorDetail) errorMessage = errorDetail;
    } catch { /* garder le message par défaut */ }
    console.error("[KYC PROXY] Erreur API IA :", iaData);
    return NextResponse.json<KycError>(
      {
        code: "INVALID_RESPONSE",
        message: errorMessage,
      },
      { status: iaResponse.status }
    );
  }

  // TODO: Enregistrer en base de données (future intégration)
  // const result = iaData as KycReponse;
  // await prisma.client.create({ data: { nom: result.champs?.nom, ... } })
  // await prisma.demandeSIM.create({ data: { scoreVerification: result.face?.similarite, ... } })

  return NextResponse.json<KycReponse>(iaData as KycReponse, { status: 200 });
}
