"""scanner.py – Scan + découpe de pièce d'identité (capot fermé).

Fonctions publiques :
    scanner()                         → image BGR brute (pleine vitre)
    decouper(img, dpi, type_carte)    → image de la pièce seule (redressée) ou None
    normaliser_type(type_carte)       → nom interne du type (identite | electeur | passeport | permis)
    envoyer(carte, face)              → réponse du serveur OCR (mode ligne de commande)
    traiter_face(face, type_carte)    → enchaîne scanner / découper / envoyer

Les algorithmes de découpe sont dans les fichiers dédiés (un par type de pièce) :
c'est la SEULE copie de chaque algorithme — les modifier là-bas suffit.
"""

import gc
import os
import shutil
import tempfile
import threading
import time

import cv2
import requests
import win32com.client

# Algorithmes de découpe (fichiers dédiés)
from scanner_carte_identite import decouper_identite
from scanner_carte_electeur import decouper_electeur, _reduire, _ordonner_quad  # noqa: F401 (utilisés par borne.py)
from scanner_passeport import decouper_passeport
from scanner_permis import decouper_permis
from decoupe_fond import decouper_fond

# ---------- RÉGLAGES ----------
NOM_SCANNER = os.environ.get("NOM_SCANNER", "").strip()     # Vide = détection auto intelligente
DPI = int(os.environ.get("SCANNER_DPI", "200"))            # 200 DPI par défaut (rapide et net pour l'OCR)


# Mode ligne de commande uniquement (la borne N'ma SIM passe par api_scanner.py)
URL_MODELE = os.environ.get("URL_MODELE", "")
CHAMP_FICHIER = "file"      # nom du champ attendu par le modèle

# Vitre A4 (mm)
VITRE_LARGEUR_MM = 216
VITRE_HAUTEUR_MM = 297
# --------------------------------

FORMAT_PNG = "{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}"

# Propriétés WIA de l'item de scan
WIA_INTENT, WIA_XRES, WIA_YRES = 6146, 6147, 6148
WIA_XPOS, WIA_YPOS, WIA_XEXTENT, WIA_YEXTENT = 6149, 6150, 6151, 6152
WIA_INTENT_COULEUR = 1
WIA_SUBTYPE_RANGE, WIA_SUBTYPE_LIST = 1, 2

# Un seul scan à la fois (le scanner est une ressource unique)
_VERROU_SCAN = threading.Lock()

# Noms acceptés → nom interne (la borne envoie cni / carte_electeur / passeport / permis)
_TYPES = {
    "identite": "identite", "cni": "identite",
    "electeur": "electeur", "carte_electeur": "electeur",
    "passeport": "passeport",
    "permis": "permis",
}


def normaliser_type(type_carte):
    """Nom interne du type de pièce ; inconnu → 'identite'."""
    return _TYPES.get((type_carte or "").strip().lower(), "identite")


def mm_to_px(mm, dpi=DPI):
    """Convertit des millimètres en pixels à la résolution donnée."""
    return int(mm / 25.4 * dpi)


def _propriete(item, prop_id):
    for p in item.Properties:
        if p.PropertyID == prop_id:
            return p
    return None


def set_prop(item, prop_id, value):
    """Modifie une propriété WIA, en respectant la plage ou la liste de valeurs acceptées.
    Retourne la valeur réellement écrite (ou None si la propriété n'existe pas)."""
    p = _propriete(item, prop_id)
    if p is None:
        return None
    try:
        if p.SubType == WIA_SUBTYPE_RANGE:
            value = max(p.SubTypeMin, min(p.SubTypeMax, value))
        elif p.SubType == WIA_SUBTYPE_LIST:
            valeurs = [int(v) for v in p.SubTypeValues]
            if valeurs and value not in valeurs:
                value = min(valeurs, key=lambda v: abs(v - value))
    except Exception:
        pass
    p.Value = value
    return value


# WIA_ERROR_BUSY (0x80210006) : « Le périphérique WIA est occupé » — autre programme de
# numérisation ouvert, API lancée deux fois, ou scan précédent pas encore relâché par Windows
WIA_ERROR_BUSY = -2145320954
ESSAIS_SI_OCCUPE = 3
ATTENTE_SI_OCCUPE_S = 2


def _scanner_occupe(e):
    """Vrai si l'exception COM est WIA_ERROR_BUSY (code dans l'exception ou dans son excepinfo)."""
    args = getattr(e, "args", ())
    if args and args[0] == WIA_ERROR_BUSY:
        return True
    infos = args[2] if len(args) > 2 and isinstance(args[2], tuple) else ()
    return len(infos) > 5 and infos[5] == WIA_ERROR_BUSY


def scanner():
    """Scanne la vitre entière et retourne l'image en mémoire (aucun fichier gardé).
    Scanner occupé → nouvel essai, jusqu'à ESSAIS_SI_OCCUPE fois."""
    import pywintypes
    for essai in range(1, ESSAIS_SI_OCCUPE + 1):
        try:
            return _scanner_une_fois()
        except pywintypes.com_error as e:
            if not _scanner_occupe(e):
                raise
            print(f"[SCANNER] Occupé (essai {essai}/{ESSAIS_SI_OCCUPE}), nouvel essai dans {ATTENTE_SI_OCCUPE_S} s")
            if essai < ESSAIS_SI_OCCUPE:
                time.sleep(ATTENTE_SI_OCCUPE_S)
    raise RuntimeError(
        "Le scanner est occupé par un autre programme. Fermez les logiciels de numérisation ouverts "
        "(Numérisation Windows, HP Smart…) et vérifiez que l'API scanner n'est lancée qu'une seule fois."
    )


def _trouver_scanner(dm):
    """Détecte automatiquement le scanner connecté.
    Priorité :
    1. Si NOM_SCANNER est défini, cherche ce nom précis.
    2. Sinon, cherche en priorité la HP DeskJet 2875 / 2800 / Advantage branchée en USB.
    3. Puis tout scanner branché en USB.
    4. En dernier recours, le premier scanner WIA disponible.
    """
    scanners = [info for info in dm.DeviceInfos if info.Type == 1]
    if not scanners:
        return None

    # Si l'utilisateur a configuré un nom précis
    if NOM_SCANNER:
        for info in scanners:
            if NOM_SCANNER.lower() in info.Properties("Name").Value.lower():
                return info

    # Priorité DeskJet 2875 / 2800 USB
    mots_cles = ["2875", "2800", "deskjet", "advantage"]
    for info in scanners:
        nom = info.Properties("Name").Value.lower()
        if any(m in nom for m in mots_cles) and "usb" in nom:
            return info

    for info in scanners:
        nom = info.Properties("Name").Value.lower()
        if any(m in nom for m in mots_cles):
            return info

    # Tout scanner USB
    for info in scanners:
        if "usb" in info.Properties("Name").Value.lower():
            return info

    return scanners[0]


def _scanner_une_fois():
    import pythoncom
    with _VERROU_SCAN:
        pythoncom.CoInitialize()
        dm = device = item = image = None
        dossier = tempfile.mkdtemp()
        try:
            dm = win32com.client.Dispatch("WIA.DeviceManager")
            info_scanner = _trouver_scanner(dm)
            if info_scanner is None:
                raise RuntimeError("Scanner introuvable. Vérifiez que l'imprimante HP est branchée en USB et allumée.")

            nom_detecte = info_scanner.Properties("Name").Value
            print(f"[SCANNER] Scanner détecté automatiquement : {nom_detecte}")
            device = info_scanner.Connect()


            item = device.Items.Item(1)
            set_prop(item, WIA_INTENT, WIA_INTENT_COULEUR)
            dpi = set_prop(item, WIA_XRES, DPI) or DPI   # résolution acceptée la plus proche
            set_prop(item, WIA_YRES, dpi)
            # Zone = toute la vitre, calculée à la résolution réellement appliquée
            set_prop(item, WIA_XPOS, 0)
            set_prop(item, WIA_YPOS, 0)
            set_prop(item, WIA_XEXTENT, mm_to_px(VITRE_LARGEUR_MM, dpi))
            set_prop(item, WIA_YEXTENT, mm_to_px(VITRE_HAUTEUR_MM, dpi))

            chemin = os.path.join(dossier, "scan.png")
            image = item.Transfer(FORMAT_PNG)
            image.SaveFile(chemin)
            img = cv2.imread(chemin)
            if img is None:
                raise RuntimeError("Impossible de lire l'image scannée")
            return img
        finally:
            shutil.rmtree(dossier, ignore_errors=True)
            # Libérer les objets COM AVANT CoUninitialize (sinon messages
            # « Win32 exception occurred releasing IUnknown » à la fermeture)
            del dm, device, item, image
            gc.collect()
            pythoncom.CoUninitialize()


def decouper(img, dpi=DPI, type_carte="identite"):
    """Aiguille vers l'algorithme adapté selon le type de carte.

    type_carte : identite | electeur | passeport | permis
                 (ou cni | carte_electeur, noms utilisés par la borne)
    """
    t = normaliser_type(type_carte)
    if img is None or img.size == 0:
        return None
    carte = decouper_fond(img)
    if carte is not None:
        return carte
    if t == "electeur":
        return decouper_electeur(img, dpi)
    if t == "passeport":
        return decouper_passeport(img, dpi)
    if t == "permis":
        return decouper_permis(img, dpi)
    return decouper_identite(img, dpi)


# -----------------------------------------------------------------------
#  Mode ligne de commande : envoi au modèle OCR
# -----------------------------------------------------------------------

def envoyer(carte, face):
    """Envoie l'image au modèle OCR, directement depuis la mémoire."""
    if not URL_MODELE:
        raise RuntimeError("URL_MODELE non configurée (variable d'environnement URL_MODELE).")
    ok, tampon = cv2.imencode(".jpg", carte, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if not ok:
        raise RuntimeError("Encodage de l'image impossible")
    reponse = requests.post(
        URL_MODELE,
        files={CHAMP_FICHIER: (f"{face}.jpg", tampon.tobytes(), "image/jpeg")},
        data={"face": face},
        timeout=30,
    )
    reponse.raise_for_status()
    return reponse.text


def traiter_face(face, type_carte="identite"):
    """Scanne une face, la découpe, l'envoie. Retourne la réponse ou None."""
    input(f"\nPosez le {face.upper()} sur la vitre, fermez le capot, "
          f"puis Entrée... ")
    try:
        img = scanner()
    except Exception as e:
        print("Scanner indisponible :", e)
        return None

    carte = decouper(img, type_carte=type_carte)
    if carte is None:
        print("Pièce non détectée. Replacez-la et réessayez.")
        return None

    try:
        return envoyer(carte, face)
    except Exception as e:
        print("Envoi impossible :", e)
        return None


if __name__ == "__main__":
    import sys
    type_cli = sys.argv[1] if len(sys.argv) > 1 else "identite"
    for face in ("recto", "verso"):
        for essai in range(3):
            reponse = traiter_face(face, type_cli)
            if reponse is not None:
                print(f"{face} envoyé. Réponse :", reponse)
                break
        else:
            print(f"Échec sur le {face}.")
            break
