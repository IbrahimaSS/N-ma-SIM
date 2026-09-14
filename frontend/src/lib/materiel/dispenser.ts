import { SerialPort, ReadlineParser } from "serialport";

const BAUD_RATE = Number(process.env.SIM_DISPENSER_BAUD_RATE) || 9600;
// Ligne imprimée par le sketch Arduino (système à crémaillère) une fois le cycle aller-retour terminé.
const ACK = process.env.SIM_DISPENSER_ACK || "Cycle terminé";
// Le cycle (800 pas aller + 800 pas retour à 12 RPM, moteur 28BYJ-48) dure ~4s : on laisse une bonne marge.
const TIMEOUT_MS = Number(process.env.SIM_DISPENSER_TIMEOUT_MS) || 8000;

// L'ouverture d'un port série réinitialise la plupart des cartes Arduino (toggle DTR).
// On laisse le temps au boot avant d'envoyer la première commande.
const BOOT_DELAY_MS = 2000;

// vendorId USB des adaptateurs série les plus courants sur les cartes/clones Arduino —
// indépendants du numéro de port COM, qui lui change d'un PC à l'autre.
const VENDOR_IDS_ARDUINO = [
  "1a86", // CH340/CH341 (clones Arduino/Nano les plus fréquents)
  "0403", // FTDI (FT232), utilisé sur certaines cartes
  "2341", // Arduino SA (Uno/Mega/Genuino officiels)
  "2a03", // Arduino SRL
  "10c4", // Silicon Labs CP210x (certains clones)
];

/**
 * Détecte automatiquement le port série de l'Arduino en scannant les périphériques USB connectés.
 * `SIM_DISPENSER_PORT` (si défini dans .env) reste prioritaire pour forcer un port précis.
 */
async function detecterPort(): Promise<string> {
  const force = process.env.SIM_DISPENSER_PORT;
  if (force) return force;

  const ports = await SerialPort.list();
  const candidats = ports.filter(
    (p) => p.vendorId && VENDOR_IDS_ARDUINO.includes(p.vendorId.toLowerCase())
  );

  if (candidats.length === 0) {
    throw new Error(
      "Aucun distributeur SIM (Arduino) détecté sur les ports série. Vérifiez qu'il est bien branché, " +
        "ou définissez SIM_DISPENSER_PORT manuellement dans .env.local."
    );
  }
  if (candidats.length > 1) {
    const liste = candidats.map((p) => p.path).join(", ");
    throw new Error(
      `Plusieurs périphériques série candidats détectés (${liste}). ` +
        "Définissez SIM_DISPENSER_PORT dans .env.local pour lever l'ambiguïté."
    );
  }
  return candidats[0].path;
}

interface DispenserConnection {
  port: SerialPort;
  parser: ReadlineParser;
  ready: Promise<void>;
}

const globalForDispenser = globalThis as unknown as {
  simDispenserPromise: Promise<DispenserConnection> | undefined;
};

async function openConnection(): Promise<DispenserConnection> {
  const portPath = await detecterPort();
  console.log(`[DISPENSER] Port détecté : ${portPath}`);

  const port = new SerialPort({ path: portPath, baudRate: BAUD_RATE }, (err) => {
    if (err) console.error(`[DISPENSER] Erreur ouverture port série ${portPath}:`, err.message);
  });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  port.on("error", (err) => {
    console.error("[DISPENSER] Erreur port série:", err.message);
  });
  port.on("close", () => {
    // Si le port se ferme (équipement débranché...), on force une reconnexion (+ re-détection) au prochain appel.
    globalForDispenser.simDispenserPromise = undefined;
  });

  const ready = new Promise<void>((resolve) => {
    setTimeout(resolve, BOOT_DELAY_MS);
  });

  return { port, parser, ready };
}

function getConnection(): Promise<DispenserConnection> {
  if (!globalForDispenser.simDispenserPromise) {
    globalForDispenser.simDispenserPromise = openConnection().catch((err) => {
      // Ne pas garder en cache une détection ratée — permet de réessayer au prochain appel.
      globalForDispenser.simDispenserPromise = undefined;
      throw err;
    });
  }
  return globalForDispenser.simDispenserPromise;
}

/**
 * Déclenche la sortie physique de la puce SIM en envoyant "E", la commande
 * lue char-par-char par le sketch Arduino (cmd == 'E' || cmd == 'e').
 * Résout uniquement après réception de la ligne de fin de cycle du moteur.
 */
export async function ejecterPuce(): Promise<{ success: true }> {
  const connection = await getConnection();
  await connection.ready;

  const { port, parser } = connection;

  if (!port.isOpen) {
    globalForDispenser.simDispenserPromise = undefined;
    throw new Error(`Port série ${port.path} indisponible.`);
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      parser.off("data", onData);
      reject(new Error(`Aucune confirmation de l'équipement après ${TIMEOUT_MS}ms.`));
    }, TIMEOUT_MS);

    function onData(line: string) {
      // Le sketch imprime plusieurs lignes pendant le cycle (progression) ; on n'attend
      // que celle qui confirme la fin (ex: "[CREMAILLERE] Cycle terminé.").
      if (!line.includes(ACK)) return;
      clearTimeout(timeout);
      parser.off("data", onData);
      resolve({ success: true });
    }

    parser.on("data", onData);

    // Le sketch lit un caractère à la fois (Serial.read()) et déclenche sur 'E'/'e' — pas de fin de ligne attendue.
    port.write("E", (err) => {
      if (!err) return;
      clearTimeout(timeout);
      parser.off("data", onData);
      reject(new Error(`Échec d'envoi de la commande à l'équipement : ${err.message}`));
    });
  });
}
