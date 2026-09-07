"""
N'ma SIM — API Vocale POULAR (compréhension des intentions)
============================================================
Reçoit un audio + la page courante, renvoie l'intention détectée en poular.

Architecture (identique au KYC) :
    App web (borne)  --audio + page-->  API Vocale  --intention-->  App web

Extracteur : openWakeWord (léger, ~1 Mo de modèles ONNX)
Classifieurs : un par page (RandomForest ou régression logistique), fichiers .pkl
Particularité : une catégorie "rien" rejette le silence, le bruit et la parole hors-sujet.

Lancer :  uvicorn app:app --host 0.0.0.0 --port 8200
"""

import os
import io
import pickle
import numpy as np
import librosa
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
DOSSIER_MODELES = os.path.join(os.path.dirname(__file__), "modeles")
LONGUEUR = 32000          # 2 secondes à 16 kHz
SEUIL = 0.35              # sous ce score max -> "je n'ai pas compris"
MARGE_AMBIGU = 0.10       # écart mini top1/top2 -> sinon "je n'ai pas compris"

# Intentions par page (l'ordre vient du modèle sauvegardé)
PAGES = {
    "page_choix_du_service": ["nouvelle_sim", "reactivation_sim"],
    "page_type_de_piece": ["carte_electeur", "carte_nationale_identite", "passeport"],
    "page_motif_reactivation": ["blocage", "inactivite", "perte"],
}

# Priorité par page : intention "verbe d'action" qui prime si détectée
PRIORITE = {
    "page_choix_du_service": "reactivation_sim",
}

# La catégorie technique de rejet (silence/bruit/hors-sujet)
CATEGORIE_RIEN = "rien"

# ----------------------------------------------------------------------
# Chargement des modèles (une seule fois au démarrage)
# ----------------------------------------------------------------------
print("Chargement de l'extracteur openWakeWord...")
from openwakeword.utils import AudioFeatures
extracteur = AudioFeatures()

print("Chargement des modèles poular par page...")
MODELES = {}
for page in PAGES:
    chemin = os.path.join(DOSSIER_MODELES, f"modele_{page}.pkl")
    if os.path.exists(chemin):
        with open(chemin, "rb") as f:
            MODELES[page] = pickle.load(f)["classifieur"]
        print(f"  ✓ {page}")
    else:
        print(f"  ✗ {page} (modèle manquant : {chemin})")

# ----------------------------------------------------------------------
# Détection
# ----------------------------------------------------------------------
def audio_vers_son(donnees_audio: bytes) -> np.ndarray:
    son, _ = librosa.load(io.BytesIO(donnees_audio), sr=16000, mono=True)
    return son


def detecter(son: np.ndarray, page: str, pas: int = 8000) -> dict:
    """
    Détecte l'intention dans un audio pour une page donnée (poular).
    - fenêtre glissante openWakeWord + fenêtre la plus confiante
    - si la catégorie 'rien' gagne -> pas d'action (silence/bruit/hors-sujet)
    - sinon règle de priorité + rejet (seuil, ambiguïté)
    """
    if page not in MODELES:
        raise HTTPException(status_code=400, detail=f"Page inconnue ou modèle manquant : {page}")

    clf = MODELES[page]
    classes = list(clf.classes_)

    son16 = (son * 32767).astype(np.int16)
    if len(son16) < LONGUEUR:
        son16 = np.pad(son16, (0, LONGUEUR - len(son16)))

    fen = []
    for st in range(0, max(1, len(son16) - LONGUEUR + 1), pas):
        fen.append(son16[st:st + LONGUEUR])
    if not fen:
        fen = [son16[:LONGUEUR]]

    emb = extracteur.embed_clips(np.array(fen)).mean(axis=1)
    probas = clf.predict_proba(emb)
    meilleure = probas.max(axis=1).argmax()      # fenêtre la plus confiante
    scores = {c: float(probas[meilleure, i]) for i, c in enumerate(classes)}

    # 1) Si 'rien' est la plus forte -> silence/bruit/hors-sujet, pas d'action
    if max(scores, key=scores.get) == CATEGORIE_RIEN:
        return {"intention": None, "raison": "rien_detecte", "scores": scores}

    # 2) Sinon, on ignore 'rien' et on décide entre les vraies intentions
    scores_utiles = {k: v for k, v in scores.items() if k != CATEGORIE_RIEN}
    prio = PRIORITE.get(page)
    tries = sorted(scores_utiles.items(), key=lambda x: -x[1])
    best, best_s = tries[0]
    second_s = tries[1][1] if len(tries) > 1 else 0.0

    if prio and scores_utiles.get(prio, 0) >= SEUIL:
        decision, raison = prio, "priorite_verbe_action"
    elif best_s < SEUIL:
        decision, raison = None, "rejet_score_faible"
    elif (best_s - second_s) < MARGE_AMBIGU:
        decision, raison = None, "rejet_ambigu"
    else:
        decision, raison = best, "score_max"

    return {"intention": decision, "raison": raison, "scores": scores}


# ----------------------------------------------------------------------
# API
# ----------------------------------------------------------------------
app = FastAPI(title="N'ma SIM — API Vocale Poular", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def accueil():
    return {
        "service": "N'ma SIM — API Vocale Poular",
        "statut": "actif",
        "langue": "poular",
        "pages_disponibles": list(MODELES.keys()),
    }


@app.get("/sante")
def sante():
    return {
        "statut": "ok",
        "langue": "poular",
        "modeles_charges": list(MODELES.keys()),
        "modeles_manquants": [p for p in PAGES if p not in MODELES],
    }


@app.post("/comprendre")
async def comprendre(page: str = Form(...), audio: UploadFile = File(...)):
    """
    Entrée : page (page_choix_du_service | page_type_de_piece | page_motif_reactivation)
             + fichier audio.
    Sortie : intention détectée (ou null si rien/pas compris), raison, scores.
    """
    if page not in PAGES:
        raise HTTPException(status_code=400,
                            detail=f"Page invalide. Choix : {list(PAGES.keys())}")

    donnees = await audio.read()
    if len(donnees) == 0:
        raise HTTPException(status_code=400, detail="Fichier audio vide.")

    try:
        son = audio_vers_son(donnees)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audio illisible : {e}")

    niveau = float(np.max(np.abs(son))) if len(son) > 0 else 0.0
    if len(son) == 0 or niveau < 1e-4:
        return {
            "intention": None,
            "raison": "audio_vide",
            "message": "Silence détecté. La borne attend un mot-clé.",
            "niveau_sonore": niveau,
        }

    resultat = detecter(son, page)
    resultat["niveau_sonore"] = niveau
    resultat["duree_s"] = round(len(son) / 16000, 2)

    if resultat["intention"] is None:
        if resultat["raison"] == "rien_detecte":
            resultat["message"] = "Rien à traiter (silence/bruit/hors-sujet). La borne n'agit pas."
        else:
            resultat["message"] = "Je n'ai pas compris. Demander au client de répéter."
    else:
        resultat["message"] = f"Intention détectée : {resultat['intention']}"

    return resultat
