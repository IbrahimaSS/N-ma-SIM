/** Déclenche un scan via l'imprimante-scanner physique et retourne l'image obtenue. */
export async function scannerViaImprimante(filename: string): Promise<File> {
  const res = await fetch("/api/materiel/scanner", { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Échec du scan.");
  }
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/jpeg" });
}
