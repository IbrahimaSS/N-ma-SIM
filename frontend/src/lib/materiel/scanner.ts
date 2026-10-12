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
const SCANNER_API_URL = (process.env.SCANNER_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export type TypePiece = "cni" | "passeport" | "carte_electeur" | "permis";

export interface ResultatScan {
  image: Buffer;
  /** true : pièce déjà découpée et redressée par l'API ; false : scan pleine vitre */
  decoupe: boolean;
}

/**
 * Scan pour la borne : d'abord via l'API Python (pièce découpée + redressée, même si elle est
 * posée de travers), sinon — API non lancée — via wia-scan.ps1 (scan pleine vitre, recadré
 * ensuite dans le navigateur). Une erreur du SCANNER lui-même (503) n'est pas masquée.
 */
export async function scannerPiece(typePiece?: TypePiece): Promise<ResultatScan> {
  let res: Response;
  try {
    const form = new FormData();
    form.set("type_carte", typePiece || "cni");
    form.set("format_retour", "image");
    form.set("brut_si_echec", "true");
    res = await fetch(`${SCANNER_API_URL}/scan`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS + 15000),
    });
  } catch {
    console.warn(`[SCANNER] API ${SCANNER_API_URL} injoignable → repli sur wia-scan.ps1`);
    return { image: await scannerDocument(), decoupe: false };
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

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", SCRIPT_PATH,
      "-OutputPath", outputPath,
      "-DPI", String(DPI),
    ]);

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
