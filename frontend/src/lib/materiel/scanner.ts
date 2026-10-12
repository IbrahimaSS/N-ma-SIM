import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { readFile, unlink } from "fs/promises";
import os from "os";
import path from "path";

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "wia-scan.ps1");
const DPI = Number(process.env.SCANNER_DPI) || 300;
// Un scan couleur à 300 DPI prend généralement 5-15s selon le matériel ; on laisse de la marge.
const TIMEOUT_MS = Number(process.env.SCANNER_TIMEOUT_MS) || 30000;
// API Python locale (dossier Scanner/, api_scanner.py) : scan + découpe + redressement OpenCV
const SCANNER_API_URL = (process.env.SCANNER_API_URL || "http://127.0.0.1:8010").replace(/\/+$/, "");

export type TypePiece = "cni" | "passeport" | "carte_electeur" | "permis";

export interface ResultatScan {
  image: Buffer;
  /** true : pièce déjà découpée et redressée par l'API ; false : scan pleine vitre */
  decoupe: boolean;
}

/**
 * Scan pour la borne : appelle l'API Python Scanner locale (pièce découpée + redressée,
 * même si elle est posée de travers). Si l'API est injoignable, remonte l'erreur
 * au lieu de tenter un repli PowerShell (souvent introuvable sur certains environnements).
 */
export async function scannerPiece(typePiece?: TypePiece): Promise<ResultatScan> {
  const url = `${SCANNER_API_URL}/scan`;
  console.log(`[SCANNER] Appel API Scanner : ${url} (type: ${typePiece || "cni"})`);

  let res: Response;
  try {
    const form = new FormData();
    form.set("type_carte", typePiece || "cni");
    form.set("format_retour", "image");
    form.set("brut_si_echec", "true");
    res = await fetch(url, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS + 15000),
    });
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error(`[SCANNER] API ${url} injoignable : ${msg}`);
    throw new Error(
      `Le scanner n'est pas joignable (${url}). ` +
      `Vérifiez que "python api_scanner.py" tourne dans le dossier Scanner/. ` +
      `Détail : ${msg}`
    );
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || `Le scan a échoué (code ${res.status}).`);
  }
  const decoupe = res.headers.get("x-decoupe") === "oui";
  console.log(`[SCANNER] API : ${res.headers.get("x-largeur")}x${res.headers.get("x-hauteur")} (${decoupe ? "pièce découpée" : "scan complet, pièce non trouvée"})`);
  return { image: Buffer.from(await res.arrayBuffer()), decoupe };
}

/**
 * Déclenche un scan via le script PowerShell WIA (wia-scan.ps1) et retourne
 * l'image JPEG résultante. Suppose que le document est déjà posé sur la vitre
 * du scanner (déclenchement manuel via bouton dans l'UI, pas de détection auto).
 */
export async function scannerDocument(): Promise<Buffer> {
  const outputPath = path.join(os.tmpdir(), `nma-scan-${randomUUID()}.jpg`);
  const psExe = process.env.SYSTEMROOT
    ? path.join(process.env.SYSTEMROOT, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    : "powershell.exe";

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(psExe, [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", SCRIPT_PATH,
      "-OutputPath", outputPath,
      "-DPI", String(DPI),
    ], { windowsHide: true, shell: true });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`Le scanner n'a pas répondu après ${TIMEOUT_MS}ms. Vérifiez qu'il est branché et qu'aucun autre logiciel (HP Smart...) ne l'utilise déjà.`));
    }, TIMEOUT_MS);

    let stderr = "";
    let stdout = "";
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.stdout.on("data", (d) => { stdout += d.toString(); });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        // Diagnostic : taille et résolution réellement obtenues (« OK 2550x3507 300dpi »),
        // plus les avertissements du pilote (résolution refusée, etc.).
        console.log(`[SCANNER] ${stdout.trim() || "OK"} (demandé : ${DPI} DPI)`);
        if (stderr.trim()) console.warn(`[SCANNER] ${stderr.trim()}`);
        resolve();
      } else {
        reject(new Error(stderr.trim() || `Le scan a échoué (code ${code}).`));
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Impossible de lancer le script de scan : ${err.message}`));
    });
  });

  try {
    return await readFile(outputPath);
  } finally {
    unlink(outputPath).catch(() => {});
  }
}
