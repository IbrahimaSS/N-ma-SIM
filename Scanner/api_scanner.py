"""api_scanner.py – API REST locale qui expose le scanner de documents à la borne N'ma SIM.

Endpoints :
    POST /scan          → Lance un scan physique + découpe + retourne l'image
    POST /scan-camera   → Reçoit une photo (fichier) + découpe + retourne l'image
    POST /scan-base64   → Reçoit une image base64 + découpe + retourne l'image
    GET  /status        → Vérifie que l'API est en ligne

type_carte : identite | electeur | passeport | permis
             (ou cni | carte_electeur, noms utilisés par la borne)

Utilisation (sur le PC de la borne, à côté de l'imprimante) :
    pip install -r requirements.txt
    python api_scanner.py
La borne Next.js appelle http://127.0.0.1:8000/scan (variable SCANNER_API_URL).
"""

import base64
import io
import os

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from scanner import decouper, normaliser_type

# ---------- Config ----------
# 127.0.0.1 : seul le PC de la borne peut déclencher le scanner (pas le reste du réseau)
HOST = os.environ.get("SCANNER_API_HOST", "127.0.0.1")
PORT = int(os.environ.get("SCANNER_API_PORT", "8000"))

ORIGINES_AUTORISEES = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
TYPES_VALIDES = {"identite", "cni", "electeur", "carte_electeur", "passeport", "permis"}
# ----------------------------

app = FastAPI(
    title="Scanner de Documents – API",
    description="API pour scanner et découper les pièces d'identité guinéennes",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINES_AUTORISEES,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------
#  Utilitaires
# -----------------------------------------------------------------------

def _img_to_jpeg_bytes(img_cv2, qualite=92):
    ok, buf = cv2.imencode(".jpg", img_cv2, [cv2.IMWRITE_JPEG_QUALITY, qualite])
    if not ok:
        raise RuntimeError("Impossible d'encoder l'image en JPEG")
    return buf.tobytes()


def _img_to_base64(img_cv2, qualite=92):
    return base64.b64encode(_img_to_jpeg_bytes(img_cv2, qualite)).decode("utf-8")


def _bytes_to_cv2(data):
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Image invalide ou format non supporté")
    return img


def _verifier_type(type_carte):
    if (type_carte or "").strip().lower() not in TYPES_VALIDES:
        raise HTTPException(status_code=400, detail=f"type_carte invalide : {type_carte}")
    return normaliser_type(type_carte)


def _repondre(img, type_carte, format_retour, decoupe):
    """Réponse commune. decoupe=False : image brute renvoyée faute de pièce détectée."""
    if format_retour == "image":
        h, w = img.shape[:2]
        return StreamingResponse(
            io.BytesIO(_img_to_jpeg_bytes(img)),
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f"inline; filename={type_carte}.jpg",
                "X-Decoupe": "oui" if decoupe else "non",
                "X-Largeur": str(w),
                "X-Hauteur": str(h),
            },
        )
    h, w = img.shape[:2]
    return JSONResponse({
        "success": True,
        "decoupe": decoupe,
        "type_carte": type_carte,
        "largeur": w,
        "hauteur": h,
        "image_base64": _img_to_base64(img),
        "format": "jpeg",
    })


def _decouper_ou_echouer(img_brut, type_carte, format_retour, brut_si_echec, message):
    carte = decouper(img_brut, type_carte=type_carte)
    if carte is not None:
        return _repondre(carte, type_carte, format_retour, True)
    if brut_si_echec:
        # Pièce non trouvée par la découpe : on rend le scan complet, le client recadrera lui-même
        return _repondre(img_brut, type_carte, format_retour, False)
    raise HTTPException(status_code=422, detail=message)


# -----------------------------------------------------------------------
#  GET /status
# -----------------------------------------------------------------------

@app.get("/status")
def status():
    """Vérifie que l'API est opérationnelle."""
    return {"status": "ok", "message": "API Scanner opérationnelle"}


# -----------------------------------------------------------------------
#  POST /scan  – Scanner physique WIA
# -----------------------------------------------------------------------

@app.post("/scan")
def scan_physique(
    type_carte: str = Form(default="identite"),
    format_retour: str = Form(default="base64"),
    brut_si_echec: bool = Form(default=False),
):
    """Lance un scan physique via WIA et retourne la carte découpée et redressée.
    format_retour : base64 | image
    brut_si_echec : true → si la pièce n'est pas trouvée, renvoie le scan complet (X-Decoupe: non)
    """
    type_carte = _verifier_type(type_carte)
    try:
        from scanner import scanner as scanner_physique
        img_brut = scanner_physique()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Scanner indisponible : {str(e)}")

    return _decouper_ou_echouer(
        img_brut, type_carte, format_retour, brut_si_echec,
        "Carte non détectée. Vérifiez que le document est bien posé sur la vitre et que le capot est fermé.",
    )


# -----------------------------------------------------------------------
#  POST /scan-camera  – Photo caméra uploadée
# -----------------------------------------------------------------------

@app.post("/scan-camera")
async def scan_camera(
    type_carte: str = Form(default="identite"),
    format_retour: str = Form(default="base64"),
    brut_si_echec: bool = Form(default=False),
    fichier: UploadFile = File(...),
):
    """Reçoit une photo de caméra (multipart/form-data) et retourne la carte découpée."""
    type_carte = _verifier_type(type_carte)
    try:
        contenu = await fichier.read()
        img_brut = _bytes_to_cv2(contenu)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image invalide : {str(e)}")

    return _decouper_ou_echouer(img_brut, type_carte, format_retour, brut_si_echec,
                                "Carte non détectée dans la photo.")


# -----------------------------------------------------------------------
#  POST /scan-base64  – Image en base64 JSON
# -----------------------------------------------------------------------

@app.post("/scan-base64")
def scan_base64(payload: dict):
    """Reçoit { image: '<base64>', type_carte: 'identite' } et retourne la carte découpée."""
    image_b64 = payload.get("image")
    type_carte = _verifier_type(payload.get("type_carte", "identite"))

    if not image_b64:
        raise HTTPException(status_code=400, detail="Champ 'image' manquant")

    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]
        contenu = base64.b64decode(image_b64)
        img_brut = _bytes_to_cv2(contenu)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image base64 invalide : {str(e)}")

    return _decouper_ou_echouer(img_brut, type_carte, "base64",
                                bool(payload.get("brut_si_echec", False)), "Carte non détectée.")


# -----------------------------------------------------------------------
#  Point d'entrée
# -----------------------------------------------------------------------

if __name__ == "__main__":
    print(f"🚀  API Scanner : http://{HOST}:{PORT}")
    print(f"📖  Documentation : http://{HOST}:{PORT}/docs")
    uvicorn.run(app, host=HOST, port=PORT)
