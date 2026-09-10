import { SerialPort, ReadlineParser } from "serialport";

const PORT_PATH = process.env.SIM_DISPENSER_PORT || "COM3";
const BAUD_RATE = Number(process.env.SIM_DISPENSER_BAUD_RATE) || 9600;
// Ligne imprimée par le sketch Arduino (système à crémaillère) une fois le cycle aller-retour terminé.
const ACK = process.env.SIM_DISPENSER_ACK || "Cycle terminé";
// Le cycle (800 pas aller + 800 pas retour à 12 RPM, moteur 28BYJ-48) dure ~4s : on laisse une bonne marge.
const TIMEOUT_MS = Number(process.env.SIM_DISPENSER_TIMEOUT_MS) || 8000;

// L'ouverture d'un port série réinitialise la plupart des cartes Arduino (toggle DTR).
// On laisse le temps au boot avant d'envoyer la première commande.
const BOOT_DELAY_MS = 2000;

interface DispenserConnection {
  port: SerialPort;
  parser: ReadlineParser;
  ready: Promise<void>;
}

const globalForDispenser = globalThis as unknown as {
  simDispenser: DispenserConnection | undefined;
};

function openConnection(): DispenserConnection {
  const port = new SerialPort({ path: PORT_PATH, baudRate: BAUD_RATE }, (err) => {
    if (err) console.error("[DISPENSER] Erreur ouverture port série:", err.message);
  });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  port.on("error", (err) => {
    console.error("[DISPENSER] Erreur port série:", err.message);
  });
  port.on("close", () => {
    // Si le port se ferme (équipement débranché...), on force une reconnexion au prochain appel.
    if (globalForDispenser.simDispenser?.port === port) {
      globalForDispenser.simDispenser = undefined;
    }
  });

  const ready = new Promise<void>((resolve) => {
    setTimeout(resolve, BOOT_DELAY_MS);
  });

  return { port, parser, ready };
}

function getConnection(): DispenserConnection {
  if (!globalForDispenser.simDispenser) {
    globalForDispenser.simDispenser = openConnection();
  }
  return globalForDispenser.simDispenser;
}

/**
 * Déclenche la sortie physique de la puce SIM en envoyant "E", la commande
 * lue char-par-char par le sketch Arduino (cmd == 'E' || cmd == 'e').
 * Résout uniquement après réception de la ligne de fin de cycle du moteur.
 */
export async function ejecterPuce(): Promise<{ success: true }> {
  const connection = getConnection();
  await connection.ready;

  const { port, parser } = connection;

  if (!port.isOpen) {
    globalForDispenser.simDispenser = undefined;
    throw new Error(`Port série ${PORT_PATH} indisponible.`);
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
