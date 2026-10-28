/**
 * ejecter-carte.mts — Fait sortir UNE carte SIM du distributeur SK-AD3, sans la borne.
 * Même déroulé que le mode "ejection" de la borne : initialisation → état → éjection complète.
 *
 * Usage (dans frontend) :
 *   node --experimental-transform-types scripts/ejecter-carte.mts [PORT]
 * Port : argument, sinon SIM_DISPENSER_PORT de .env.local, sinon COM5.
 *
 * Le serveur de la borne (npm run dev) doit être arrêté : il garde le port ouvert.
 */
import { readFileSync } from "node:fs";
import { SerialPort } from "serialport";
import { SKAD3, POS_FRONT_EJECT, empileurVide, empileurBas, captureePleine } from "../src/lib/materiel/skad3.ts";

function lireEnvLocal(): Record<string, string> {
  try {
    const texte = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    return Object.fromEntries(
      texte.split(/\r?\n/)
        .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => [m[1], m[2]]),
    );
  } catch {
    return {};
  }
}

const env = lireEnvLocal();
const chemin = process.argv[2] || process.env.SIM_DISPENSER_PORT || env.SIM_DISPENSER_PORT || "COM5";
const adresse = Number(process.env.SKAD3_ADRESSE ?? env.SKAD3_ADRESSE) || 0;

const port = new SerialPort({ path: chemin, baudRate: 9600, dataBits: 8, parity: "none", stopBits: 1, autoOpen: false });

try {
  await new Promise<void>((ok, ko) => port.open((e) => (e ? ko(new Error(`Port ${chemin} : ${e.message}`)) : ok())));
  console.log(`Connecté au distributeur sur ${chemin} (adresse ${adresse})`);

  const skad3 = new SKAD3({
    ecrire: (octets) => new Promise((ok, ko) => port.write(octets, (e) => (e ? ko(e) : port.drain(() => ok())))),
    surReception: (recevoir) => port.on("data", recevoir),
  }, adresse);

  console.log(`Initialisé, firmware ${await skad3.initialiser()}`);
  const etat = await skad3.etat();
  if (empileurVide(etat)) throw new Error("Empileur vide : rechargez des cartes SIM.");
  if (empileurBas(etat)) console.warn("Attention : empileur presque vide.");
  if (captureePleine(etat)) console.warn("Attention : bac de capture plein.");

  await skad3.deplacer(POS_FRONT_EJECT);
  console.log("✅ Carte éjectée.");
  process.exitCode = 0;
} catch (e) {
  console.error("❌ Échec :", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  if (port.isOpen) await new Promise((ok) => port.close(() => ok(undefined)));
}
