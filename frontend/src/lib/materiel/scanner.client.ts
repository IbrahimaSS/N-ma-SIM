/**
 * Déclenche un scan via l'imprimante-scanner physique et retourne l'image obtenue.
 * `typePiece` permet à l'API locale de choisir l'algorithme de découpe adapté.
 */
export async function scannerViaImprimante(filename: string, typePiece?: string | null): Promise<File> {
  const res = await fetch("/api/materiel/scanner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typePiece: typePiece ?? undefined }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Échec du scan.");
  }
  const blob = await res.blob();
  // Pièce déjà découpée et redressée par l'API locale : marquée dans le nom pour que
  // recadrerPiece ne la recoupe pas (agrandissement seulement).
  const nom = res.headers.get("X-Decoupe") === "oui" ? filename.replace(/\.jpg$/i, "") + "_decoupe.jpg" : filename;
  return new File([blob], nom, { type: "image/jpeg" });
}
