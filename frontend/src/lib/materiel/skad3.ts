/**
 * Protocole du distributeur de cartes Syncotek SK-AD3 (RS232, 9600 8N1).
 * Traduction de pilote_SK-AD3_NmaSIM/skad3.py (protocole vérifié par son auteur dans AD3_API.dll) :
 *   trame  : STX(F2) ADDR LEN_H LEN_L TEXTE ETX(03) BCC   (BCC = XOR de STX à ETX inclus)
 *   échange: hôte → commande | SK-AD3 → ACK (06) sous 500 ms | hôte → ENQ (05) | SK-AD3 → réponse
 *   réponse: 'P' CM PM ST0 ST1 ST2 DONNÉES (succès) ou 'N' CM PM E1 E0 (erreur)
 * Le transport est injecté (port série réel ou faux distributeur de test).
 */

const STX = 0xf2, ETX = 0x03, ACK = 0x06, NAK = 0x15, ENQ = 0x05;

// Déplacements (CM 0x32)
export const POS_FRONT_HOLD = 0x30; // avant, carte maintenue : le client la retire
export const POS_FRONT_EJECT = 0x39; // ejection complete, sans maintien
export const POS_IC = 0x31; // lecteur de puce (contact)
export const POS_CAPTURE = 0x33; // bac de capture (rejet)
// Initialisation (CM 0x30)
export const INIT_TO_CAPTURE = 0x31; // une carte oubliée dans le canal part au bac de capture
export const INIT_NO_MOVE = 0x33;
// Tension d'alimentation de la puce (CM 0x51 0x30)
export const VCC_5V_ISO = 0x33;
export const VCC_3V_ISO = 0x35;

const ERREURS: Record<string, string> = {
  "00": "Commande non définie", "01": "Paramètre de commande incorrect", "02": "Séquence de commandes incorrecte",
  "03": "Commande non supportée par le matériel", "04": "Données de commande erronées", "05": "Contact carte IC désactivé",
  "10": "Carte coincée (bourrage)", "12": "Erreur capteur", "13": "Carte trop longue", "14": "Carte trop courte",
  "40": "Carte retirée pendant la reprise", "41": "Erreur solénoïde IC", "43": "Impossible d'aller en position IC",
  "45": "Carte déplacée par une force extérieure", "50": "Dépassement du compteur", "51": "Erreur moteur",
  "60": "Échec alimentation carte IC", "61": "Échec activation carte IC", "62": "Carte IC ne supporte pas la commande",
  "65": "Carte IC désactivée", "66": "Carte IC ne supporte aucune commande", "67": "Erreur de transmission carte IC",
  "68": "Timeout transmission carte IC", "69": "Carte CPU/SAM non conforme EMV",
  A0: "Empileur vide", A1: "Bac de capture plein", B0: "Distributeur non initialisé",
};

/** Erreur renvoyée par le distributeur (réponse 'N'). */
export class ErreurSKAD3 extends Error {
  constructor(public code: string, public cm: number, public pm: number) {
    super(`Distributeur : ${ERREURS[code] ?? "erreur inconnue"} (code ${code})`);
  }
}
/** Problème de liaison série (pas d'ACK, délai, BCC faux…). */
export class ErreurCommunication extends Error {}
/** La puce SIM a refusé une commande (mot d'état SW différent de 9000). */
export class ErreurApdu extends Error {
  constructor(message: string, public sw: string) { super(message); }
}

export interface Etat {
  canal: string; // ST0 : 0 aucune carte, 1 carte dans le canal, 2 carte au lecteur
  empileur: string; // ST1 : 0 vide, 1 presque vide, 2 suffisant
  capture: string; // ST2 : 0 non plein, 1 plein
}
export const empileurVide = (e: Etat) => e.empileur === "0";
export const empileurBas = (e: Etat) => e.empileur === "1";
export const captureePleine = (e: Etat) => e.capture === "1";

/** Transport octet par octet : port série réel, ou faux distributeur pour les tests. */
export interface Transport {
  ecrire(octets: Buffer): Promise<void>;
  /** Branche la réception : chaque bloc d'octets reçu doit être passé à `recevoir`. */
  surReception(recevoir: (bloc: Buffer) => void): void;
}

const bcc = (octets: Buffer) => octets.reduce((x, b) => x ^ b, 0);

export class SKAD3 {
  private tampon = Buffer.alloc(0);
  private reveil: (() => void) | null = null;

  constructor(private transport: Transport, private adresse = 0, private delaiAck = 500, private essais = 2) {
    transport.surReception((bloc) => {
      this.tampon = Buffer.concat([this.tampon, bloc]);
      this.reveil?.();
    });
  }

  // ── Lecture avec échéance ────────────────────────────────────────────────
  private async lire(n: number, echeance: number): Promise<Buffer> {
    while (this.tampon.length < n) {
      const reste = echeance - Date.now();
      if (reste <= 0) throw new ErreurCommunication(`Délai dépassé en lecture (${this.tampon.length}/${n} octets)`);
      await new Promise<void>((r) => {
        const t = setTimeout(r, reste);
        this.reveil = () => { clearTimeout(t); r(); };
      });
      this.reveil = null;
    }
    const lu = Buffer.from(this.tampon.subarray(0, n));
    this.tampon = this.tampon.subarray(n);
    return lu;
  }

  private trame(texte: Buffer): Buffer {
    const corps = Buffer.concat([Buffer.from([STX, this.adresse, (texte.length >> 8) & 0xff, texte.length & 0xff]), texte, Buffer.from([ETX])]);
    return Buffer.concat([corps, Buffer.from([bcc(corps)])]);
  }

  /** Attend l'ACK en ignorant les autres octets (comme la DLL du fabricant). */
  private async attendreAck(): Promise<boolean> {
    const echeance = Date.now() + this.delaiAck;
    try {
      for (;;) {
        const [b] = await this.lire(1, echeance);
        if (b === ACK) return true;
        if (b === NAK) return false;
      }
    } catch {
      return false;
    }
  }

  private async lireTrame(delai: number): Promise<Buffer> {
    const echeance = Date.now() + delai;
    while ((await this.lire(1, echeance))[0] !== STX) { /* octets parasites avant STX */ }
    const [adr, lh, ll] = await this.lire(3, echeance);
    const texte = await this.lire((lh << 8) | ll, echeance);
    const [etx, chk] = await this.lire(2, echeance);
    if (etx !== ETX) throw new ErreurCommunication(`ETX attendu, reçu ${etx.toString(16)}`);
    const attendu = bcc(Buffer.concat([Buffer.from([STX, adr, lh, ll]), texte, Buffer.from([ETX])]));
    if (chk !== attendu) throw new ErreurCommunication(`BCC invalide (reçu ${chk.toString(16)}, attendu ${attendu.toString(16)})`);
    return texte;
  }

  /** Envoie une commande et renvoie l'état + les données de la réponse 'P'. */
  async commande(cm: number, pm: number, donnees: Buffer = Buffer.alloc(0), delaiExecution = 10000): Promise<{ etat: Etat; donnees: Buffer }> {
    const t = this.trame(Buffer.concat([Buffer.from([0x43, cm, pm]), donnees]));
    let acquitte = false;
    for (let i = 0; i < this.essais && !acquitte; i++) {
      this.tampon = Buffer.alloc(0);
      await this.transport.ecrire(t);
      acquitte = await this.attendreAck();
    }
    if (!acquitte) throw new ErreurCommunication("Le distributeur ne répond pas (vérifiez le port, le câble RS232, l'alimentation 24 V et l'adresse)");

    let texte: Buffer | null = null;
    let derniere: unknown = null;
    for (let i = 0; i < this.essais && !texte; i++) {
      await this.transport.ecrire(Buffer.from([ENQ]));
      try {
        texte = await this.lireTrame(Math.max(delaiExecution, 10000));
      } catch (e) {
        derniere = e; // réponse absente ou corrompue → on renvoie ENQ
      }
    }
    if (!texte) throw new ErreurCommunication(`Pas de réponse valide du distributeur : ${derniere instanceof Error ? derniere.message : derniere}`);

    if (texte[0] === 0x50) {
      const etat = { canal: String.fromCharCode(texte[3]), empileur: String.fromCharCode(texte[4]), capture: String.fromCharCode(texte[5]) };
      return { etat, donnees: Buffer.from(texte.subarray(6)) };
    }
    if (texte[0] === 0x4e) throw new ErreurSKAD3(texte.subarray(3, 5).toString("ascii"), texte[1], texte[2]);
    throw new ErreurCommunication(`En-tête de réponse inconnu ${texte[0].toString(16)}`);
  }

  // ── Commandes du distributeur ─────────────────────────────────────────────
  /** Obligatoire après chaque mise sous tension. Renvoie la version du firmware. */
  async initialiser(mode = INIT_TO_CAPTURE): Promise<string> {
    return (await this.commande(0x30, mode, undefined, 15000)).donnees.toString("ascii");
  }
  async etat(): Promise<Etat> {
    return (await this.commande(0x31, 0x30)).etat;
  }
  async deplacer(position: number): Promise<Etat> {
    return (await this.commande(0x32, position)).etat;
  }
  /** Met la puce sous tension ; renvoie l'ATR. */
  async alimenterPuce(vcc = VCC_5V_ISO): Promise<Buffer> {
    return (await this.commande(0x51, 0x30, Buffer.from([vcc]))).donnees.subarray(1);
  }
  async couperPuce(): Promise<void> {
    await this.commande(0x51, 0x31);
  }
  /** APDU (T=0/T=1 automatique) ; renvoie la réponse de la puce (données + SW1 SW2). */
  async apdu(capdu: Buffer): Promise<Buffer> {
    return (await this.commande(0x51, 0x39, capdu)).donnees;
  }

  // ── Dialogue avec la puce SIM ─────────────────────────────────────────────
  /** APDU avec GET RESPONSE (9F/61) et correction de longueur (6C) ; renvoie données + SW. */
  private async apduSw(hex: string, gsm: boolean): Promise<{ donnees: Buffer; sw: string }> {
    let r = await this.apdu(Buffer.from(hex.replace(/\s/g, ""), "hex"));
    let [sw1, sw2] = [r[r.length - 2], r[r.length - 1]];
    if (sw1 === 0x9f || sw1 === 0x61) {
      r = await this.apdu(Buffer.from([gsm ? 0xa0 : 0x00, 0xc0, 0x00, 0x00, sw2]));
      [sw1, sw2] = [r[r.length - 2], r[r.length - 1]];
    }
    if (sw1 === 0x6c) {
      const c = Buffer.from(hex.replace(/\s/g, ""), "hex");
      c[c.length - 1] = sw2;
      r = await this.apdu(c);
      [sw1, sw2] = [r[r.length - 2], r[r.length - 1]];
    }
    return { donnees: Buffer.from(r.subarray(0, r.length - 2)), sw: Buffer.from([sw1, sw2]).toString("hex").toUpperCase() };
  }

  private async apduOk(hex: string, gsm: boolean): Promise<Buffer> {
    const { donnees, sw } = await this.apduSw(hex, gsm);
    if (sw !== "9000") throw new ErreurApdu(`${hex} → SW ${sw}`, sw);
    return donnees;
  }

  /** ICCID (EF 2FE2) : classe GSM (A0) puis UICC (00). */
  async lireIccid(): Promise<string> {
    let brut: Buffer;
    try {
      await this.apduOk("A0 A4 00 00 02 3F 00", true);
      await this.apduOk("A0 A4 00 00 02 2F E2", true);
      brut = await this.apduOk("A0 B0 00 00 0A", true);
    } catch (e) {
      if (!(e instanceof ErreurApdu)) throw e;
      await this.apduOk("00 A4 00 04 02 3F 00", false);
      await this.apduOk("00 A4 00 04 02 2F E2", false);
      brut = await this.apduOk("00 B0 00 00 0A", false);
    }
    return decoderIccid(brut);
  }

  /**
   * IMSI (EF 6F07). Sa lecture exige souvent le PIN1 : il est présenté UNE seule fois par carte,
   * et seulement si la puce le demande (3 essais faux bloquent la carte ; 1 essai ne la bloque jamais).
   */
  async lireImsi(pin: string): Promise<string> {
    const champPin = Buffer.alloc(8, 0xff);
    champPin.write(pin, "ascii");
    const pinHex = champPin.toString("hex");

    const lire = async (gsm: boolean) => {
      const cla = gsm ? "A0" : "00";
      const lecture = `${cla} B0 00 00 09`;
      let r = await this.apduSw(lecture, gsm);
      if (["9804", "6982"].includes(r.sw)) {
        const v = await this.apduSw(`${cla} 20 00 01 08 ${pinHex}`, gsm);
        if (v.sw !== "9000") throw new ErreurApdu(`PIN de la carte refusé (SW ${v.sw})`, v.sw);
        r = await this.apduSw(lecture, gsm);
      }
      if (r.sw !== "9000") throw new ErreurApdu(`Lecture de l'IMSI refusée (SW ${r.sw})`, r.sw);
      return decoderImsi(r.donnees);
    };

    try {
      await this.apduOk("A0 A4 00 00 02 3F 00", true);
      await this.apduOk("A0 A4 00 00 02 7F 20", true); // DF GSM
      await this.apduOk("A0 A4 00 00 02 6F 07", true);
      return await lire(true);
    } catch (e) {
      // Puce sans classe GSM : application USIM (sélection par AID partiel), même fichier 6F07
      if (!(e instanceof ErreurApdu) || /PIN/.test(e.message)) throw e;
      await this.apduOk("00 A4 04 04 07 A0 00 00 00 87 10 02", false);
      await this.apduOk("00 A4 00 04 02 6F 07", false);
      return await lire(false);
    }
  }
}

/** EF_ICCID : BCD à quartets inversés, complété par F. */
export function decoderIccid(brut: Buffer): string {
  return [...brut].map((b) => `${(b & 0x0f).toString(16)}${(b >> 4).toString(16)}`).join("").toUpperCase().replace(/F+$/, "");
}

/** EF_IMSI : 1er octet = longueur, puis BCD à quartets inversés ; le 1er quartet est un indicateur de parité. */
export function decoderImsi(brut: Buffer): string {
  const longueur = Math.min(brut[0] ?? 0, brut.length - 1);
  const chiffres = [...brut.subarray(1, 1 + longueur)].map((b) => `${(b & 0x0f).toString(16)}${(b >> 4).toString(16)}`).join("");
  return chiffres.slice(1).replace(/f+$/i, "");
}
