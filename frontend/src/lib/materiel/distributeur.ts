import { randomInt } from "crypto";
import { SerialPort } from "serialport";
import {
  SKAD3, ErreurSKAD3, ErreurApdu, POS_IC, POS_FRONT_HOLD, POS_FRONT_EJECT, POS_CAPTURE, VCC_5V_ISO, VCC_3V_ISO,
  empileurVide, empileurBas, captureePleine,
} from "./skad3";

/**
 * Distributeur de cartes SIM Syncotek SK-AD3 (RS232 via adaptateur USB).
 *
 * .env.local de la borne :
 *   SIM_DISPENSER_PORT   port série (ex. COM3) ; sinon détection de l'adaptateur USB-RS232
 *   SKAD3_ADRESSE        adresse 0..15 du sélecteur de la carte électronique (défaut 0)
 *   SIM_PIN1             PIN imprimé sur les cartes, présenté une fois si la puce l'exige (défaut 0000)
 *   SIM_DISPENSER_MODE   "simulation" sur un PC de développement (aucun matériel) — jamais sur la borne
 */

export interface CarteLue {
  iccid: string;
  imsi: string; // 15 chiffres (ex. 611012062359768)
}

/** La carte a été lue mais l'opérateur l'a refusée ; `carteEnCause` = essayer une autre carte a du sens. */
export class ErreurActivation extends Error {
  constructor(message: string, public carteEnCause = false) { super(message); }
}

// Adaptateurs USB-RS232 courants (puces FTDI, CH340, Prolific, Silicon Labs)
const VENDOR_IDS_USB_SERIE = ["0403", "1a86", "067b", "10c4"];

async function detecterPort(): Promise<string> {
  if (process.env.SIM_DISPENSER_PORT) return process.env.SIM_DISPENSER_PORT;
  const candidats = (await SerialPort.list()).filter((p) => p.vendorId && VENDOR_IDS_USB_SERIE.includes(p.vendorId.toLowerCase()));
  if (candidats.length === 0) {
    throw new Error("Aucun distributeur SIM détecté (adaptateur USB-RS232 absent). Vérifiez le branchement, ou définissez SIM_DISPENSER_PORT dans .env.local.");
  }
  if (candidats.length > 1) {
    throw new Error(`Plusieurs ports série détectés (${candidats.map((p) => p.path).join(", ")}). Définissez SIM_DISPENSER_PORT dans .env.local.`);
  }
  return candidats[0].path;
}

interface Connexion { port: SerialPort; skad3: SKAD3; initialise: boolean }

const globalDistributeur = globalThis as unknown as {
  skad3Connexion?: Promise<Connexion>;
  skad3File?: Promise<unknown>;
};

async function ouvrir(): Promise<Connexion> {
  const chemin = await detecterPort();
  const port = new SerialPort({ path: chemin, baudRate: 9600, dataBits: 8, parity: "none", stopBits: 1, autoOpen: false });
  await new Promise<void>((ok, ko) => port.open((e) => (e ? ko(new Error(`Port ${chemin} : ${e.message}`)) : ok())));
  port.on("close", () => { globalDistributeur.skad3Connexion = undefined; }); // débranché → reconnexion au prochain appel
  port.on("error", (e) => console.error("[SK-AD3] Erreur port série :", e.message));
  const skad3 = new SKAD3({
    ecrire: (octets) => new Promise((ok, ko) => port.write(octets, (e) => (e ? ko(e) : port.drain(() => ok())))),
    surReception: (recevoir) => port.on("data", recevoir),
  }, Number(process.env.SKAD3_ADRESSE) || 0);
  console.log(`[SK-AD3] Connecté sur ${chemin}`);
  return { port, skad3, initialise: false };
}

function connexion(): Promise<Connexion> {
  if (!globalDistributeur.skad3Connexion) {
    globalDistributeur.skad3Connexion = ouvrir().catch((e) => {
      globalDistributeur.skad3Connexion = undefined;
      throw e;
    });
  }
  return globalDistributeur.skad3Connexion;
}

/** Une seule opération à la fois sur le distributeur (deux clients ne se croisent jamais). */
function enFile<T>(travail: () => Promise<T>): Promise<T> {
  const suite = (globalDistributeur.skad3File ?? Promise.resolve()).then(travail, travail);
  globalDistributeur.skad3File = suite.catch(() => undefined);
  return suite;
}

/** Lit la carte au lecteur : tension 5 V, puis 3 V si la puce la refuse (erreurs 60/61). */
async function lireCarte(skad3: SKAD3): Promise<CarteLue> {
  try {
    await skad3.alimenterPuce(VCC_5V_ISO);
  } catch (e) {
    if (!(e instanceof ErreurSKAD3) || !["60", "61"].includes(e.code)) throw e;
    await skad3.alimenterPuce(VCC_3V_ISO);
  }
  const iccid = await skad3.lireIccid();
  const imsi = await skad3.lireImsi(process.env.SIM_PIN1 || "0000");
  return { iccid, imsi };
}

/**
 * Une carte : lecteur de puce → lecture ICCID + IMSI → `activer` (opérateur) → présentée au client.
 * Lecture ou activation en échec → la carte part au bac de capture : le client ne reçoit jamais
 * une carte inactive.
 */
async function distribuerUneCarte<T>(skad3: SKAD3, activer: (carte: CarteLue) => Promise<T>): Promise<{ carte: CarteLue; resultat: T }> {
  const etat = await skad3.etat();
  if (empileurVide(etat)) throw new ErreurSKAD3("A0", 0x31, 0x30);
  if (empileurBas(etat)) console.warn("[SK-AD3] Empileur presque vide : prévoir un rechargement");
  if (captureePleine(etat)) console.warn("[SK-AD3] Bac de capture plein : les rejets échoueront");

  await skad3.deplacer(POS_IC);
  let carte: CarteLue | null = null;
  try {
    carte = await lireCarte(skad3);
    console.log(`[SK-AD3] Carte lue : ICCID ${carte.iccid}, IMSI ${carte.imsi}`);
    const resultat = await activer(carte);
    await skad3.couperPuce().catch(() => {});
    await skad3.deplacer(POS_FRONT_HOLD);
    return { carte, resultat };
  } catch (e) {
    console.error(`[SK-AD3] Carte ${carte?.iccid ?? "illisible"} envoyée au bac de capture :`, e instanceof Error ? e.message : e);
    await skad3.couperPuce().catch(() => {});
    await skad3.deplacer(POS_CAPTURE).catch((err) => console.error("[SK-AD3] Capture impossible :", err.message));
    throw e;
  }
}

// En simulation : cartes fictives au format Orange, même déroulé (lecture → activation → présentation)
async function distribuerSimulation<T>(activer: (carte: CarteLue) => Promise<T>): Promise<{ carte: CarteLue; resultat: T }> {
  await new Promise((r) => setTimeout(r, 800));
  const carte = {
    iccid: `8922401${String(randomInt(0, 1e9)).padStart(9, "0")}${String(randomInt(0, 1e4)).padStart(4, "0")}`,
    imsi: `6110120${String(randomInt(0, 1e8)).padStart(8, "0")}`,
  };
  console.log(`[SK-AD3] Mode simulation : carte lue ICCID ${carte.iccid}, IMSI ${carte.imsi}`);
  try {
    const resultat = await activer(carte);
    console.log("[SK-AD3] Mode simulation : carte présentée au client");
    return { carte, resultat };
  } catch (e) {
    console.log("[SK-AD3] Mode simulation : carte envoyée au bac de capture");
    throw e;
  }
}

/**
 * Délivre une carte SIM ACTIVE. Si une carte est illisible ou refusée par l'opérateur
 * (`carteEnCause`), elle est rejetée et on essaie la suivante, au plus `cartesMax` cartes.
 */
export function ejecterCarte(): Promise<void> {
  return enFile(async () => {
    if (process.env.SIM_DISPENSER_MODE === "simulation") {
      throw new Error("Desactivez le mode simulation pour ejecter une carte physique.");
    }
    const c = await connexion();
    if (!c.initialise) {
      await c.skad3.initialiser();
      c.initialise = true;
    }
    const etat = await c.skad3.etat();
    if (empileurVide(etat)) throw new ErreurSKAD3("A0", 0x31, 0x30);
    // Pas de lecture ICCID/IMSI, d'activation ou de nouvelle tentative d'ejection.
    await c.skad3.deplacer(POS_FRONT_EJECT);
    console.log("[SK-AD3] Carte ejectee sans lecture ni activation");
  });
}

export function distribuerCarte<T>(activer: (carte: CarteLue) => Promise<T>, cartesMax = 2): Promise<{ carte: CarteLue; resultat: T }> {
  return enFile(async () => {
    let derniere: unknown = null;
    for (let i = 0; i < cartesMax; i++) {
      try {
        if (process.env.SIM_DISPENSER_MODE === "simulation") return await distribuerSimulation(activer);
        const c = await connexion();
        if (!c.initialise) {
          console.log(`[SK-AD3] Initialisé, firmware ${await c.skad3.initialiser()}`);
          c.initialise = true;
        }
        return await distribuerUneCarte(c.skad3, activer);
      } catch (e) {
        derniere = e;
        if (e instanceof ErreurSKAD3 && e.code === "B0") {
          const c = await connexion();
          c.initialise = false; // distributeur redémarré : réinitialiser puis réessayer
          continue;
        }
        // Puce illisible (APDU refusé, erreurs puce 6x) ou carte refusée par l'opérateur → carte suivante
        const carteEnCause = e instanceof ErreurApdu
          || (e instanceof ErreurSKAD3 && e.code.startsWith("6"))
          || (e instanceof ErreurActivation && e.carteEnCause);
        if (!carteEnCause) throw e;
      }
    }
    throw derniere;
  });
}
