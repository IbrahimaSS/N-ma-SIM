#!/usr/bin/env python3
"""
simulateur_skad3.py - Faux distributeur SK-AD3 pour développer sans le matériel (Linux / Raspberry Pi / macOS).

    python simulateur_skad3.py            -> affiche un port virtuel, ex. /dev/pts/5
    python skad3.py --port /dev/pts/5 dispense

Sous Windows : installer com0com (paire COM virtuelle) puis
    python simulateur_skad3.py --port COM11   et   python skad3.py --port COM10 dispense
"""
import argparse
import os
import threading

import serial

STX, ETX, ACK, NAK, ENQ = 0xF2, 0x03, 0x06, 0x15, 0x05
ICCID = "89224010000123456789"     # ICCID fictif (Guinée = 224)


def bcc(b):
    x = 0
    for c in b:
        x ^= c
    return x


def encode_iccid(s):
    s = s.ljust(20, "F")
    return bytes(int(s[i + 1] + s[i], 16) for i in range(0, 20, 2))


class FakeSKAD3:
    def __init__(self, ser, addr=0, cards=5, fail_iccid=False):
        self.ser, self.addr = ser, addr
        self.cards, self.captured = cards, 0
        self.card_pos = None           # None / "ic" / "front"
        self.initialized = False
        self.powered = False
        self.selected = None
        self.pending = b""
        self.fail_iccid = fail_iccid

    def st(self):
        st0 = "0" if self.card_pos is None else ("2" if self.card_pos == "ic" else "1")
        st1 = "0" if self.cards == 0 else ("1" if self.cards < 3 else "2")
        st2 = "1" if self.captured >= 25 else "0"
        return (st0 + st1 + st2).encode()

    def ok(self, cm, pm, data=b""):
        return bytes([0x50, cm, pm]) + self.st() + data

    def err(self, cm, pm, code):
        return bytes([0x4E, cm, pm]) + code.encode()

    def sim_apdu(self, c):
        ins = c[1]
        if ins == 0xA4:
            fid = c[5:7]
            self.selected = fid.hex().upper()
            return b"\x9f\x0f" if c[0] == 0xA0 else b"\x90\x00"
        if ins == 0xC0:
            return bytes(c[4]) + b"\x90\x00"
        if ins == 0xB0 and self.selected == "2FE2":
            if self.fail_iccid:
                return b"\x69\x82"
            return encode_iccid(ICCID) + b"\x90\x00"
        return b"\x6D\x00"

    def handle(self, text):
        cm, pm, data = text[1], text[2], text[3:]
        if cm == 0x30:
            self.initialized = True
            if self.card_pos:
                self.card_pos = None
                if pm in (0x31, 0x35):
                    self.captured += 1
            return self.ok(cm, pm, b"SK-AD3_SIM_V10")
        if not self.initialized:
            return self.err(cm, pm, "B0")
        if cm == 0x31:
            return self.ok(cm, pm, b"1" * 12 if pm == 0x31 else b"")
        if cm == 0x32:
            if pm == 0x31:
                if self.card_pos is None:
                    if self.cards == 0:
                        return self.err(cm, pm, "A0")
                    self.cards -= 1
                self.card_pos = "ic"
            elif pm == 0x30:
                if self.card_pos is None:
                    if self.cards == 0:
                        return self.err(cm, pm, "A0")
                    self.cards -= 1
                self.card_pos = "front"
                print("  >> carte présentée au client")
            elif pm == 0x33:
                self.card_pos = None
                self.captured += 1
                print("  >> carte capturée")
            return self.ok(cm, pm)
        if cm == 0x51:
            if pm == 0x30:
                if self.card_pos != "ic":
                    return self.err(cm, pm, "60")
                self.powered = True
                return self.ok(cm, pm, b"\x30" + bytes.fromhex("3B9E96801FC78031E073FE211B66D00217C41100C0"))
            if pm == 0x31:
                self.powered = False
                return self.ok(cm, pm)
            if pm in (0x33, 0x39):
                if not self.powered:
                    return self.err(cm, pm, "65")
                return self.ok(cm, pm, self.sim_apdu(data))
        if cm == 0xA2:
            return self.ok(cm, pm, b"\x0c052609036980")
        if cm == 0xA3:
            return self.ok(cm, pm, b"7V10RERR220")
        if cm == 0xA4:
            return self.ok(cm, pm, b"SK-AD3_SIM_V10")
        return self.err(cm, pm, "00")

    def run(self):
        s = self.ser
        while True:
            b = s.read(1)
            if not b or b[0] != STX:
                continue
            addr, lh, ll = s.read(3)
            text = s.read((lh << 8) | ll)
            etx, chk = s.read(2)
            body = bytes([STX, addr, lh, ll]) + text + bytes([ETX])
            if chk != bcc(body) or etx != ETX:
                s.write(bytes([NAK]))
                continue
            if addr != self.addr:
                continue
            s.write(bytes([ACK]))
            resp = self.handle(text)
            print(f"C {text[1]:02X} {text[2]:02X} -> {chr(resp[0])} {resp[3:].hex(' ').upper()[:60]}")
            out = bytes([STX, self.addr, len(resp) >> 8, len(resp) & 0xFF]) + resp + bytes([ETX])
            if s.read(1)[0] != ENQ:       # comme le vrai appareil : réponse envoyée sur ENQ
                print("  !! ENQ attendu")
                continue
            s.write(out + bytes([bcc(out)]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", help="port réel (paire virtuelle com0com sous Windows)")
    ap.add_argument("--cards", type=int, default=5)
    ap.add_argument("--fail-iccid", action="store_true")
    a = ap.parse_args()
    if a.port:
        ser = serial.Serial(a.port, 9600, timeout=None)
    else:
        master, slave = os.openpty()
        print("Port virtuel du simulateur :", os.ttyname(slave))
        import tty
        tty.setraw(slave)
        ser = _FdSerial(master)
    FakeSKAD3(ser, cards=a.cards, fail_iccid=a.fail_iccid).run()


class _FdSerial:
    def __init__(self, fd):
        self.fd = fd

    def read(self, n):
        buf = b""
        while len(buf) < n:
            buf += os.read(self.fd, n - len(buf))
        return buf

    def write(self, b):
        os.write(self.fd, b)


if __name__ == "__main__":
    main()
