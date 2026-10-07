import type { KycReponse, KycError } from "@/types/kyc";

/**
 * Service frontend KYC
 *
 * Appelle uniquement notre backend proxy /api/kyc.
 * Ne connaît jamais l'URL http://localhost:8000.
 */

/**
 * JPEG 1x1 minimal valide, utilisé uniquement comme espace réservé quand
 * l'étape scan-piece appelle l'API sans selfie (le selfie réel arrive à
 * l'étape suivante). L'API KYC exige désormais le champ "selfie" sur
 * chaque appel ; cette étape ne lit que `champs` (OCR) dans la réponse,
 * jamais le résultat du visage, donc ce placeholder est sans impact.
 */
const PLACEHOLDER_SELFIE_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function creerSelfiePlaceholder(): Blob {
  const octets = atob(PLACEHOLDER_SELFIE_BASE64);
  const bytes = new Uint8Array(octets.length);
  for (let i = 0; i < octets.length; i++) bytes[i] = octets.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}

/**
 * Lance la vérification KYC complète.
 * Doit être appelée uniquement depuis l'écran selfie, une fois
 * que recto + selfie (+ verso optionnel) sont disponibles.
 *
 * @param recto  - Image recto de la pièce d'identité
 * @param selfie - Photo selfie du client
 * @param verso  - Image verso (optionnelle, utile pour CNI)
 * @returns      - Réponse complète de l'API IA
 * @throws       - KycError si la vérification échoue
 */
export async function verifierKYC(
  recto: File | Blob,
  selfie?: File | Blob | null,
  verso?: File | Blob | null,
  docType?: string | null
): Promise<KycReponse> {
  const formData = new FormData();

  // Noms de champs attendus exactement par l'API IA
  formData.append("recto", recto, getFileName(recto, "recto.jpg"));
  
  formData.append(
    "selfie",
    selfie ?? creerSelfiePlaceholder(),
    selfie ? getFileName(selfie, "selfie.jpg") : "placeholder.jpg"
  );

  if (verso) {
    formData.append("verso", verso, getFileName(verso, "verso.jpg"));
  }

  if (docType) {
    formData.append("doc_type", docType);
  }

  let response: Response;
  try {
    response = await fetch("/api/kyc", {
      method: "POST",
      body: formData,
      // Pas de Content-Type : le navigateur le génère avec le boundary
    });
  } catch (networkError) {
    console.error("[verifierKYC] Erreur réseau :", networkError);
    const err: KycError = {
      code: "IA_UNAVAILABLE",
      message: "Impossible de contacter le serveur d'analyse. Vérifiez votre connexion.",
    };
    throw err;
  }

  const data = await response.json();

  if (!response.ok) {
    const err = data as KycError;
    console.error("[verifierKYC] Erreur serveur :", err);
    throw err;
  }

  return data as KycReponse;
}

/** Extrait le nom d'un fichier ou retourne un nom par défaut */
function getFileName(file: File | Blob, fallback: string): string {
  if (file instanceof File && file.name) return file.name;
  return fallback;
}
