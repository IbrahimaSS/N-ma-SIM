#!/usr/bin/env python3
"""
skad3.py - Pilote multiplateforme pour le distributeur de cartes Syncotek SK-AD3
(Windows 10/11, Linux, Raspberry Pi) - projet N'ma SIM.

Basé sur "SK-AD3 Series Communication Protocol" rév. A.
Dépendance unique : pyserial   ->   pip install pyserial

Usage rapide (CLI) :
    python skad3.py ports
    python skad3.py --port COM3 status
    python skad3.py --port /dev/ttyUSB0 iccid
    python skad3.py --port /dev/ttyUSB0 dispense      (distribue + lit l'ICCID + présente la carte)

Usage en bibliothèque :
    from skad3 import SKAD3
    with SKAD3("COM3") as d:
        d.initialize()
        iccid = d.dispense_sim(activate=lambda iccid: mon_api.activer(iccid))
"""
from __future__ import annotations

import argparse
import logging
import sys
import time
from dataclasses import dataclass
from typing import Callable, Optional

import serial
import serial.tools.list_ports

log = logging.getLogger("skad3")

# --- Caractères de contrôle -------------------------------------------------
STX, ETX = 0xF2, 0x03
ACK, NAK, EOT, ENQ = 0x06, 0x15, 0x04, 0x05

# --- Paramètres de déplacement (CM 0x32) -----------------------------------
POS_FRONT_HOLD = 0x30   # avant, carte maintenue (le client la retire)
POS_IC = 0x31           # position lecteur contact (SIM)
POS_RF = 0x32           # position lecteur sans contact
POS_CAPTURE = 0x33      # bac de capture (rejet)
POS_FRONT_EJECT = 0x39  # avant SANS maintien (carte éjectée)

# --- Paramètres d'initialisation (CM 0x30) ---------------------------------
INIT_TO_FRONT = 0x30
INIT_TO_CAPTURE = 0x31
INIT_NO_MOVE = 0x33

# --- Tension d'activation carte CPU (CM 0x51 0x30) --------------------------
VCC_5V_EMV = 0x30
VCC_5V_ISO = 0x33
VCC_3V_ISO = 0x35

ERRORS = {
    "00": "Commande non définie",
    "01": "Paramètre de commande incorrect",
    "02": "Séquence de commandes incorrecte",
    "03": "Commande non supportée par le matériel",
    "04": "Données de commande erronées",
    "05": "Contact carte IC désactivé",
    "10": "Carte coincée (bourrage)",
    "12": "Erreur capteur",
    "13": "Carte trop longue",
    "14": "Carte trop courte",
    "40": "Carte retirée pendant la reprise",
    "41": "Erreur solénoïde IC",
    "43": "Impossible d'aller en position IC",
    "45": "Carte déplacée par une force extérieure",
    "50": "Dépassement du compteur",
    "51": "Erreur moteur",
    "60": "Échec alimentation carte IC",
    "61": "Échec activation carte IC",
    "62": "Carte IC ne supporte pas la commande",
    "65": "Carte IC désactivée",
    "66": "Carte IC ne supporte aucune commande",
    "67": "Erreur de transmission carte IC",
    "68": "Timeout transmission carte IC",
    "69": "Carte CPU/SAM non conforme EMV",
    "A0": "Empileur vide",
    "A1": "Bac de capture plein",
    "B0": "Distributeur non initialisé",
}

ST0 = {"0": "aucune carte dans le canal", "1": "une carte dans le canal", "2": "carte en position IC/RF"}
ST1 = {"0": "empileur VIDE", "1": "empileur presque vide", "2": "empileur suffisant"}
ST2 = {"0": "bac de capture non plein", "1": "bac de capture PLEIN"}


class SKAD3Error(Exception):
    """Erreur renvoyée par le distributeur (réponse 'N')."""

    def __init__(self, code: str, cm: int, pm: int):
        self.code = code
        self.cm, self.pm = cm, pm
        super().__init__(f"Erreur {code} (CM={cm:02X} PM={pm:02X}) : {ERRORS.get(code, 'inconnue')}")


class CommError(Exception):
    """Problème de communication série (timeout, BCC, NAK...)."""


class APDUError(Exception):
    pass


@dataclass
class Status:
    st0: str
    st1: str
    st2: str

    @property
    def stacker_empty(self) -> bool:
        return self.st1 == "0"

    @property
    def stacker_low(self) -> bool:
        return self.st1 == "1"

    @property
    def capture_full(self) -> bool:
        return self.st2 == "1"

    @property
    def card_inside(self) -> bool:
        return self.st0 != "0"

    def __str__(self) -> str:
        return (f"{ST0.get(self.st0, self.st0)} | {ST1.get(self.st1, self.st1)} | "
                f"{ST2.get(self.st2, self.st2)}")


@dataclass
class Response:
    cm: int
    pm: int
    status: Status
    data: bytes


def bcc(frame: bytes) -> int:
    x = 0
    for b in frame:
        x ^= b
    return x


class SKAD3:
    """
    bcc_mode : "stx_etx" = XOR de STX à ETX inclus (confirmé dans AD3_API.dll, à garder).
    address  : 0..15, sélecteur sur la carte électronique (0 dans la démo AD3_TEST).
    """

    def __init__(self, port: str, baudrate: int = 9600, address: int = 0x00,
                 bcc_mode: str = "stx_etx", timeout: float = 0.5, retries: int = 2):
        self.port_name = port
        self.address = address
        self.bcc_mode = bcc_mode
        self.ack_timeout = timeout          # 500 ms, comme AD3_API.dll
        self.retries = retries
        self.ser = serial.Serial(port=port, baudrate=baudrate, bytesize=8, parity="N",
                                 stopbits=1, timeout=timeout)

    # -- gestion du contexte ------------------------------------------------
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    def close(self):
        if self.ser and self.ser.is_open:
            self.ser.close()

    # -- trames -------------------------------------------------------------
    def _build(self, text: bytes) -> bytes:
        head = bytes([STX, self.address, (len(text) >> 8) & 0xFF, len(text) & 0xFF])
        body = head + text + bytes([ETX])
        chk = bcc(body) if self.bcc_mode == "stx_etx" else bcc(text)
        return body + bytes([chk])

    def _wait_ack(self) -> bool:
        """Attend ACK en ignorant les autres octets (comme la DLL)."""
        deadline = time.monotonic() + self.ack_timeout
        while time.monotonic() < deadline:
            b = self.ser.read(1)
            if b and b[0] == ACK:
                return True
            if b and b[0] == NAK:
                return False
        return False

    def _read_exact(self, n: int, deadline: float) -> bytes:
        buf = b""
        while len(buf) < n:
            if time.monotonic() > deadline:
                raise CommError(f"Timeout en lecture ({len(buf)}/{n} octets)")
            chunk = self.ser.read(n - len(buf))
            buf += chunk
        return buf

    def _read_frame(self, timeout: float) -> bytes:
        deadline = time.monotonic() + timeout
        # attendre STX
        while True:
            b = self._read_exact(1, deadline)
            if b[0] == STX:
                break
            log.debug("octet ignoré avant STX : %02X", b[0])
        addr, lh, ll = self._read_exact(3, deadline)
        length = (lh << 8) | ll
        text = self._read_exact(length, deadline)
        etx, chk = self._read_exact(2, deadline)
        if etx != ETX:
            raise CommError(f"ETX attendu, reçu {etx:02X}")
        body = bytes([STX, addr, lh, ll]) + text + bytes([ETX])
        expected = bcc(body) if self.bcc_mode == "stx_etx" else bcc(text)
        if chk != expected:
            raise CommError(f"BCC invalide (reçu {chk:02X}, attendu {expected:02X})")
        log.debug("RX %s", (body + bytes([chk])).hex(" ").upper())
        return text

    def command(self, cm: int, pm: int, data: bytes = b"", exec_timeout: float = 10.0) -> Response:
        """
        Échange conforme à AD3_API.dll (vérifié par désassemblage) :
          HOST -> commande   |  C/D -> ACK (06) sous 500 ms  (2 essais)
          HOST -> ENQ (05)   |  C/D -> réponse sous 10 s     (ENQ renvoyé si timeout/BCC faux)
        Aucun ACK n'est renvoyé par l'hôte après la réponse.
        """
        frame = self._build(bytes([0x43, cm, pm]) + data)
        for attempt in range(1, self.retries + 1):
            self.ser.reset_input_buffer()
            log.debug("TX %s", frame.hex(" ").upper())
            self.ser.write(frame)
            self.ser.flush()
            if self._wait_ack():
                break
            log.warning("Pas d'ACK (essai %d/%d)", attempt, self.retries)
        else:
            raise CommError("Le distributeur ne répond pas (vérifiez port, câble, alimentation 24 V "
                            "et adresse)")

        last_err = None
        for attempt in range(1, self.retries + 1):
            self.ser.write(bytes([ENQ]))
            self.ser.flush()
            try:
                text = self._read_frame(max(exec_timeout, 10.0))
                break
            except CommError as e:
                last_err = e
                log.warning("Réponse non reçue/corrompue (%s), renvoi ENQ %d/%d", e, attempt, self.retries)
        else:
            raise CommError(f"Pas de réponse valide : {last_err}")

        head = text[0]
        r_cm, r_pm = text[1], text[2]
        if head == ord("P"):
            st = Status(chr(text[3]), chr(text[4]), chr(text[5]))
            return Response(r_cm, r_pm, st, bytes(text[6:]))
        if head == ord("N"):
            raise SKAD3Error(text[3:5].decode("ascii", "replace"), r_cm, r_pm)
        raise CommError(f"En-tête de réponse inconnu {head:02X}")

    # -- commandes de base --------------------------------------------------
    def initialize(self, mode: int = INIT_TO_CAPTURE) -> str:
        """À appeler en premier après la mise sous tension. Renvoie la version firmware.
        Par défaut, une carte oubliée dans le canal part au bac de capture."""
        r = self.command(0x30, mode, exec_timeout=15)
        return r.data.decode("ascii", "replace")

    def status(self) -> Status:
        return self.command(0x31, 0x30).status

    def sensors(self) -> dict:
        r = self.command(0x31, 0x31)
        names = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "KS1", "KS2"]
        # Valeurs brutes '0'/'1' : la doc protocole dit 30H = carte, la doc API dit 31H = carte.
        # À calibrer sur le matériel (lancer `sensors` avec et sans carte).
        return {n: chr(v) for n, v in zip(names, r.data)}

    def move(self, position: int) -> Status:
        return self.command(0x32, position, exec_timeout=10).status

    def set_insertion(self, allow: bool) -> Status:
        return self.command(0x33, 0x30 if allow else 0x31).status

    def detect_ic_type(self) -> str:
        r = self.command(0x50, 0x30)
        return r.data.decode("ascii", "replace")   # "10" = T=0 CPU, "11" = T=1 CPU

    # -- carte à puce (SIM) --------------------------------------------------
    def cpu_activate(self, vcc: int = VCC_5V_ISO) -> bytes:
        r = self.command(0x51, 0x30, bytes([vcc]))
        return r.data[1:]            # data[0] = type protocole (30 T=0 / 31 T=1), puis ATR

    def cpu_deactivate(self):
        self.command(0x51, 0x31)

    def apdu(self, capdu: bytes) -> bytes:
        """APDU avec sélection automatique T=0/T=1. Renvoie R-APDU (data + SW1 SW2)."""
        return self.command(0x51, 0x39, capdu).data

    def apdu_hex(self, hexstr: str) -> bytes:
        return self.apdu(bytes.fromhex(hexstr.replace(" ", "")))

    # -- commandes étendues ---------------------------------------------------
    def serial_number(self) -> str:
        d = self.command(0xA2, 0x30).data
        if d and d[0] == len(d) - 1:          # 1er octet = longueur binaire
            d = d[1:]
        return d.decode("ascii", "replace").strip()

    def version(self) -> str:
        return self.command(0xA4, 0x30).data.decode("ascii", "replace")

    def config(self) -> str:
        return self.command(0xA3, 0x30).data.decode("ascii", "replace")

    # -- lecture ICCID -------------------------------------------------------
    def _apdu_ok(self, capdu: str, cla_gsm: bool) -> bytes:
        resp = self.apdu_hex(capdu)
        sw1, sw2 = resp[-2], resp[-1]
        if sw1 == 0x9F or sw1 == 0x61:                # données disponibles -> GET RESPONSE
            cla = "A0" if cla_gsm else "00"
            resp = self.apdu_hex(f"{cla} C0 00 00 {sw2:02X}")
            sw1, sw2 = resp[-2], resp[-1]
        if sw1 == 0x6C:                               # mauvaise longueur Le -> on renvoie avec la bonne
            resp = self.apdu_hex(capdu[:-2] + f"{sw2:02X}")
            sw1, sw2 = resp[-2], resp[-1]
        if (sw1, sw2) != (0x90, 0x00):
            raise APDUError(f"{capdu} -> SW {sw1:02X}{sw2:02X}")
        return resp[:-2]

    def read_iccid(self) -> str:
        """Lit EF_ICCID (2FE2). Essaie d'abord la classe GSM (A0), puis la classe UICC (00)."""
        try:
            self._apdu_ok("A0 A4 00 00 02 3F 00", True)
            self._apdu_ok("A0 A4 00 00 02 2F E2", True)
            raw = self._apdu_ok("A0 B0 00 00 0A", True)
        except APDUError as e:
            log.info("Classe GSM refusée (%s), essai UICC/USIM", e)
            self._apdu_ok("00 A4 00 04 02 3F 00", False)
            self._apdu_ok("00 A4 00 04 02 2F E2", False)
            raw = self._apdu_ok("00 B0 00 00 0A", False)
        return decode_iccid(raw)

    # -- flux complet N'ma SIM -----------------------------------------------
    def dispense_sim(self, activate: Optional[Callable[[str], bool]] = None,
                     vcc: int = VCC_5V_ISO) -> str:
        """
        1. vérifie l'empileur  2. carte -> lecteur IC  3. lit l'ICCID
        4. appelle activate(iccid) (API opérateur)  5. présente la carte ou la capture.
        Renvoie l'ICCID si la carte a été présentée au client, lève une exception sinon.
        """
        st = self.status()
        if st.stacker_empty:
            raise SKAD3Error("A0", 0x31, 0x30)
        if st.capture_full:
            log.warning("Bac de capture plein : les rejets échoueront")
        if st.stacker_low:
            log.warning("Empileur presque vide : prévoir un rechargement")

        self.move(POS_IC)
        iccid = None
        try:
            atr = self.cpu_activate(vcc)
            log.info("ATR %s", atr.hex().upper())
            iccid = self.read_iccid()
            log.info("ICCID %s", iccid)
            ok = activate(iccid) if activate else True
        except Exception:
            log.exception("Échec lecture/activation : carte envoyée au bac de capture")
            self._safe_deactivate()
            self.move(POS_CAPTURE)
            raise
        self._safe_deactivate()
        if not ok:
            self.move(POS_CAPTURE)
            raise RuntimeError(f"Activation refusée par l'opérateur pour ICCID {iccid} : carte capturée")
        self.move(POS_FRONT_HOLD)
        return iccid

    def _safe_deactivate(self):
        try:
            self.cpu_deactivate()
        except Exception as e:  # noqa: BLE001
            log.debug("Mise hors tension ignorée : %s", e)

    # -- auto-détection du mode BCC / de l'adresse -------------------------
    @classmethod
    def probe(cls, port: str, baudrate: int = 9600) -> Optional["SKAD3"]:
        for mode in ("stx_etx",):
            for addr in (0x00, 0x0F) + tuple(range(1, 15)):
                dev = cls(port, baudrate, addr, mode, retries=1)
                try:
                    dev.command(0x30, INIT_NO_MOVE)   # comme AD3_Connect
                    return dev
                except SKAD3Error:
                    return dev      # une réponse 'N' prouve que la trame est comprise
                except CommError:
                    dev.close()
        return None


def decode_iccid(raw: bytes) -> str:
    """EF_ICCID : BCD avec quartets inversés, complété par F."""
    digits = "".join(f"{b & 0x0F:X}{b >> 4:X}" for b in raw)
    return digits.rstrip("F")


def list_ports():
    for p in serial.tools.list_ports.comports():
        print(f"{p.device:20} {p.description}  [{p.hwid}]")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Pilote SK-AD3 (N'ma SIM)")
    ap.add_argument("--port", help="COM3 (Windows), /dev/ttyUSB0 (Linux / Raspberry Pi)")
    ap.add_argument("--baud", type=int, default=9600)
    ap.add_argument("--addr", type=lambda s: int(s, 0), default=0x00, help="adresse 0..15 (défaut 0)")
    ap.add_argument("--bcc", choices=["stx_etx", "text_only"], default="stx_etx")
    ap.add_argument("-v", "--verbose", action="store_true", help="affiche les trames hex")
    ap.add_argument("cmd", choices=["ports", "probe", "init", "status", "sensors", "info",
                                    "front", "eject", "ic", "capture", "iccid", "dispense", "apdu"])
    ap.add_argument("arg", nargs="?", help="APDU hex pour la commande apdu")
    a = ap.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if a.verbose else logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s")

    if a.cmd == "ports":
        return list_ports()
    if not a.port:
        ap.error("--port est requis")

    if a.cmd == "probe":
        d = SKAD3.probe(a.port, a.baud)
        if not d:
            print("Aucune réponse. Vérifiez câble, alimentation 24 V et vitesse.")
            return 1
        print(f"OK : adresse={d.address} bcc={d.bcc_mode}")
        d.close()
        return 0

    with SKAD3(a.port, a.baud, a.addr, a.bcc) as d:
        if a.cmd == "init":
            print("Firmware :", d.initialize())
        elif a.cmd == "status":
            print(d.status())
        elif a.cmd == "sensors":
            for k, v in d.sensors().items():
                print(f"{k:4} {v}")
        elif a.cmd == "info":
            print("Série  :", d.serial_number())
            print("Version:", d.version())
            print("Config :", d.config())
        elif a.cmd == "front":
            print(d.move(POS_FRONT_HOLD))
        elif a.cmd == "eject":
            print(d.move(POS_FRONT_EJECT))
        elif a.cmd == "ic":
            print(d.move(POS_IC))
        elif a.cmd == "capture":
            print(d.move(POS_CAPTURE))
        elif a.cmd == "iccid":
            d.move(POS_IC)
            print("ATR  :", d.cpu_activate().hex().upper())
            print("ICCID:", d.read_iccid())
            d.cpu_deactivate()
        elif a.cmd == "dispense":
            d.initialize()
            print("ICCID distribué :", d.dispense_sim())
        elif a.cmd == "apdu":
            print(d.apdu_hex(a.arg).hex(" ").upper())
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (SKAD3Error, CommError, APDUError, RuntimeError, serial.SerialException) as e:
        print("ERREUR :", e, file=sys.stderr)
        sys.exit(2)
