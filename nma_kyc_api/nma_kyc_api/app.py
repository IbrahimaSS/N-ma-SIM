# -*- coding: utf-8 -*-
"""
app.py — API web (FastAPI) qui expose le pipeline KYC N'ma SIM.

L'appli web envoie les photos de la pièce (et le selfie) à cette API,
qui renvoie un JSON avec la décision, l'âge, les champs extraits et la clé unique.

Lancer en local :
    uvicorn app:app --host 0.0.0.0 --port 8000

Documentation interactive (fournie automatiquement par FastAPI) :
    http://localhost:8000/docs
"""
import os
import tempfile
import traceback
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from nma_kyc import kyc_complet


def _json_sur(obj):
    """Rend un objet JSON-sérialisable (convertit les types numpy en types Python natifs)."""
    import numpy as np
    if isinstance(obj, dict):
        return {k: _json_sur(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_sur(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

app = FastAPI(
    title="N'ma SIM — API KYC",
    description="Vérification d'identité pour la distribution automatisée de cartes SIM (Orange Guinée).",
    version="1.0.0",
)

# --- CORS : autorise l'appli web (frontend) à appeler cette API depuis le navigateur ---
# ⚠️ EN PRODUCTION : remplace ["*"] par l'URL exacte de ton frontend (ex ["https://kiosque.orange.gn"]).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _sauver_temp(fichier: UploadFile, suffixe: str) -> str:
    """Écrit un fichier uploadé sur le disque temporaire et renvoie son chemin."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffixe)
    tmp.write(fichier.file.read())
    tmp.close()
    return tmp.name


def _nettoyer(*chemins):
    """Supprime les fichiers temporaires après traitement."""
    for c in chemins:
        if c and os.path.exists(c):
            try:
                os.remove(c)
            except OSError:
                pass


@app.get("/")
def racine():
    """Point de santé simple — permet de vérifier que l'API tourne."""
    return {"service": "nma-sim-kyc", "statut": "actif", "version": "1.0.0"}


@app.get("/health")
def health():
    """Health check (utilisé par les orchestrateurs / le monitoring)."""
    return {"statut": "ok"}


@app.post("/kyc")
async def verifier_identite(
    recto: UploadFile = File(..., description="Photo du recto de la pièce (obligatoire)"),
    selfie: Optional[UploadFile] = File(None, description="Selfie de la personne (optionnel pour l'extraction seule)"),
    verso: Optional[UploadFile] = File(None, description="Photo du verso (CNI et passeport ; ignorer pour la carte d'électeur)"),
):
    """
    Vérifie une identité à partir des photos d'une pièce + un selfie (optionnel).
    
    Renvoie un JSON :
      - decision        : "✅ ACCEPTÉ" / "⚠️ VÉRIFICATION MANUELLE" / "❌ REJETÉ (...)"
      - type_piece      : "CNI" / "PASSEPORT" / "CARTE_ELECTEUR" / "INCONNU"
      - age             : âge calculé (ou null si illisible)
      - risque          : score 0-100
      - champs          : dictionnaire des champs extraits
      - cle             : clé unique KYC (pour identifier la personne côté N'ma SIM)
      - visage          : résultat de la vérification faciale (ou None si pas de selfie)
      - details         : journal des contrôles (âge, expiration, MRZ, visage...)
    """
    p_recto = p_verso = p_selfie = None
    try:
        p_recto = _sauver_temp(recto, ".jpg")
        p_selfie = _sauver_temp(selfie, ".jpg") if selfie is not None else None
        p_verso = _sauver_temp(verso, ".jpg") if verso is not None else None

        rapport = kyc_complet(p_recto, p_verso, p_selfie)

        # On ne renvoie PAS l'image (image_recto) dans la réponse JSON : trop lourd et inutile au frontend.
        rapport.pop("image_recto", None)

        return JSONResponse(content=_json_sur(rapport))   # conversion sûre (numpy -> types natifs)

    except Exception as e:
        # On log la trace côté serveur, on renvoie un message clair côté client.
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur pendant la vérification KYC : {e}")

    finally:
        _nettoyer(p_recto, p_verso, p_selfie)
