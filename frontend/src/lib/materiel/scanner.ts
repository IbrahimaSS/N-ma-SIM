import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { readFile, unlink } from "fs/promises";
import os from "os";
import path from "path";

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "wia-scan.ps1");
const DPI = Number(process.env.SCANNER_DPI) || 300;
// Un scan couleur à 300 DPI prend généralement 5-15s selon le matériel ; on laisse de la marge.
const TIMEOUT_MS = Number(process.env.SCANNER_TIMEOUT_MS) || 30000;

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
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
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
