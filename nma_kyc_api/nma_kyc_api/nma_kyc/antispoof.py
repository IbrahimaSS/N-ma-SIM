# -*- coding: utf-8 -*-
"""
nma_kyc.antispoof — Détection de vivacité (anti-spoofing passif) via MiniFASNet.

Détecte si une image montre un VRAI visage/objet devant la caméra, ou une PHOTO
(imprimée ou affichée sur un écran de téléphone). Sert à deux choses :
  - liveness du selfie (la personne est-elle réellement là ?)
  - anti-spoofing de la pièce (scanne-t-on la vraie carte ou une photo d'écran ?)

Modèles : Silent-Face-Anti-Spoofing (MiniFASNet), ONNX, CPU.
  - 2.7_80x80_MiniFASNetV2.onnx
  - 4_0_0_80x80_MiniFASNetV1SE.onnx
Ensemble des deux modèles (on additionne les probabilités).

⚠️ LIMITE HONNÊTE : efficace contre les photos imprimées et les rejeux d'écran
   basiques, mais ce N'EST PAS une solution certifiée ISO/IEC 30107-3.
   Pour une production critique, prévoir une solution certifiée.

Sortie de verifier_liveness(image) :
  {"vrai": True/False/None, "score": 0.0-1.0, "erreur": None ou message}
"""
import os
import urllib.request

import cv2
import numpy as np

# URLs des poids ONNX (dépôt public ONNX de Silent-Face-Anti-Spoofing)
_MODELES = {
    "2.7_80x80_MiniFASNetV2.onnx":
        "https://github.com/QingHeYang/Silent-Face-Anti-Spoofing-onnx/raw/main/onnx/2.7_80x80_MiniFASNetV2.onnx",
    "4_0_0_80x80_MiniFASNetV1SE.onnx":
        "https://github.com/QingHeYang/Silent-Face-Anti-Spoofing-onnx/raw/main/onnx/4_0_0_80x80_MiniFASNetV1SE.onnx",
}
# Chaque modèle a un "scale" (marge autour du visage) encodé dans son nom.
_SCALES = {"2.7_80x80_MiniFASNetV2.onnx": 2.7, "4_0_0_80x80_MiniFASNetV1SE.onnx": 4.0}

_DOSSIER = os.path.join(os.path.expanduser("~"), ".nma_kyc_models")
_SESSIONS = None                                          # sessions ONNX (chargées 1 fois)

# Seuil : score de "vrai visage" au-dessus duquel on considère l'image authentique.
SEUIL_LIVENESS = 0.55


def _telecharger_modeles():
    """Télécharge les 2 modèles ONNX au premier usage (dans ~/.nma_kyc_models)."""
    os.makedirs(_DOSSIER, exist_ok=True)
    for nom, url in _MODELES.items():
        chemin = os.path.join(_DOSSIER, nom)
        if not os.path.exists(chemin):
            urllib.request.urlretrieve(url, chemin)       # téléchargement
    return {nom: os.path.join(_DOSSIER, nom) for nom in _MODELES}


def _get_sessions():
    """Charge les sessions ONNX MiniFASNet (paresseux, une seule fois)."""
    global _SESSIONS
    if _SESSIONS is None:
        import onnxruntime as ort
        chemins = _telecharger_modeles()
        _SESSIONS = {}
        for nom, chemin in chemins.items():
            sess = ort.InferenceSession(chemin, providers=["CPUExecutionProvider"])
            _SESSIONS[nom] = (sess, _SCALES[nom])
    return _SESSIONS


def _crop_avec_marge(image, bbox, scale, taille=80):
    """Recadre le visage avec la marge attendue par MiniFASNet, puis redimensionne en 80x80.
    bbox = (x1, y1, x2, y2). scale = facteur d'agrandissement de la boîte."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = bbox
    bw, bh = x2 - x1, y2 - y1
    cx, cy = x1 + bw / 2, y1 + bh / 2                     # centre du visage
    # côté de la boîte agrandie (carrée)
    cote = int(max(bw, bh) * scale)
    nx1 = max(0, int(cx - cote / 2)); ny1 = max(0, int(cy - cote / 2))
    nx2 = min(w, int(cx + cote / 2)); ny2 = min(h, int(cy + cote / 2))
    crop = image[ny1:ny2, nx1:nx2]
    if crop.size == 0:
        return None
    return cv2.resize(crop, (taille, taille))            # 80x80 attendu par le modèle


def _softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()


def verifier_liveness(image, bbox=None, seuil=None):
    """Analyse une image et dit si c'est un VRAI visage/objet ou une PHOTO.
    - image : tableau BGR (OpenCV) ou chemin de fichier.
    - bbox  : boîte du visage (x1,y1,x2,y2). Si None, on utilise toute l'image.
    Renvoie {"vrai": bool|None, "score": float, "erreur": str|None}."""
    seuil = SEUIL_LIVENESS if seuil is None else seuil
    if isinstance(image, str):
        image = cv2.imread(image)
    if image is None:
        return {"vrai": None, "score": None, "erreur": "Image illisible"}

    if bbox is None:                                      # pas de boîte -> image entière
        h, w = image.shape[:2]
        bbox = (0, 0, w, h)

    try:
        sessions = _get_sessions()
        proba_totale = np.zeros(3)                        # [fake_2d, real, fake_3d]
        for nom, (sess, scale) in sessions.items():
            crop = _crop_avec_marge(image, bbox, scale)   # recadrage adapté au modèle
            if crop is None:
                continue
            # préparation : BGR->RGB, HWC->CHW, batch
            blob = crop[:, :, ::-1].transpose(2, 0, 1).astype(np.float32)
            blob = np.expand_dims(blob, axis=0)
            sortie = sess.run(None, {sess.get_inputs()[0].name: blob})[0]
            proba_totale += _softmax(sortie[0])           # on additionne les 2 modèles
        proba_totale /= len(sessions)                     # moyenne
        score_reel = float(proba_totale[1])               # proba de la classe "real"
        est_vrai = (int(np.argmax(proba_totale)) == 1) and (score_reel >= seuil)
        return {"vrai": bool(est_vrai), "score": round(score_reel, 3), "erreur": None}
    except Exception as e:
        return {"vrai": None, "score": None, "erreur": str(e)}
