"""
N'ma SIM — API Vocale (compréhension des intentions)
=====================================================
Reçoit un audio + la page courante, renvoie l'intention détectée en soussou.

Architecture (identique au KYC) :
    App web (borne)  --audio + page-->  API Vocale  --intention-->  App web

Extracteur : openWakeWord (léger, ~200 Ko de modèles)
Classifieurs : un réseau de neurones par page (fichiers .keras)

Lancer :  uvicorn app:app --host 0.0.0.0 --port 8100
"""

import os
import io
import numpy as np
import librosa
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
DOSSIER_MODELES = os.path.join(os.path.dirname(__file__), "modeles")
LONGUEUR = 32000          # 2 secondes à 16 kHz
SEUIL = 0.5               # sous ce score max -> "je n'ai pas compris"
MARGE_AMBIGU = 0.10       # écart mini top1/top2 -> sinon "je n'ai pas compris"

# Marge d'ambiguïté renforcée pour certaines pages (classes acoustiquement proches).
# "carte d'électeur" vs "carte nationale d'identité" partagent le mot "carte" :
# on exige un écart plus net, sinon on demande de répéter (au lieu de choisir CNI par défaut).
MARGE_AMBIGU_PAGE = {
    "page_type_de_piece": 0.20,
}

# Paires de classes à départager strictement : si ce sont le top1/top2 et que
# l'écart est faible -> rejet "ambigu" (ne jamais trancher au petit bonheur).
PAIRES_STRICTES = {
    "page_type_de_piece": [("carte_electeur", "carte_nationale_identite")],
}

# Intentions par page (l'ordre doit correspondre à l'entraînement)
PAGES = {
    "page_choix_du_service": ["nouvelle_sim", "reactivation_sim"],
    "page_type_de_piece": ["carte_electeur", "carte_nationale_identite", "passeport"],
    "page_motif_reactivation": ["blocage", "inactivite", "perte"],
}

# Priorité par page : intention "verbe d'action" qui prime si détectée
# (ex : "réactiver" prime sur "sim" dans "je veux réactiver ma sim")
PRIORITE = {
    "page_choix_du_service": "reactivation_sim",
}

# ----------------------------------------------------------------------
# Chargement des modèles (une seule fois au démarrage)
# ----------------------------------------------------------------------
print("Chargement de l'extracteur openWakeWord...")
from openwakeword.utils import AudioFeatures
extracteur = AudioFeatures()

print("Chargement des modèles par page...")
import pickle
MODELES = {}
for page in PAGES:
    chemin = os.path.join(DOSSIER_MODELES, f"modele_{page}.pkl")
    if os.path.exists(chemin):
        with open(chemin, "rb") as f:
            contenu = pickle.load(f)
        MODELES[page] = contenu["classifieur"]  # LogisticRegression (scikit-learn)
        print(f"  ✓ {page}")
    else:
        print(f"  ✗ {page} (modèle manquant : {chemin})")

# ----------------------------------------------------------------------
# Fonctions de détection
# ----------------------------------------------------------------------
def audio_vers_son(donnees_audio: bytes) -> np.ndarray:
    """Convertit des octets audio (n'importe quel format) en signal 16 kHz mono."""
    son, _ = librosa.load(io.BytesIO(donnees_audio), sr=16000, mono=True)
    return son


def detecter(son: np.ndarray, page: str, pas: int = 8000) -> dict:
    """
    Détecte l'intention dans un audio pour une page donnée.
    Reproduit EXACTEMENT la fonction detecter_page() du notebook
    OpenWakeWord_3Pages_Soussou.ipynb (cellule 5) : régression logistique
    scikit-learn + fenêtre glissante + "meilleure fenêtre" + priorité/rejet.
    """
    if page not in MODELES:
        raise HTTPException(status_code=400, detail=f"Page inconnue ou modèle manquant : {page}")

    clf = MODELES[page]                 # LogisticRegression (scikit-learn)
    classes = list(clf.classes_)        # ordre des intentions tel qu'appris

    # Préparer le signal (identique au notebook)
    son16 = (son * 32767).astype(np.int16)
    if len(son16) < LONGUEUR:
        son16 = np.pad(son16, (0, LONGUEUR - len(son16)))

    fen = []
    for st in range(0, max(1, len(son16) - LONGUEUR + 1), pas):
        fen.append(son16[st:st + LONGUEUR])
    if not fen:
        fen = [son16[:LONGUEUR]]

    emb = extracteur.embed_clips(np.array(fen)).mean(axis=1)
    probas = clf.predict_proba(emb)     # (n_fenetres, n_classes)

    # CLÉ (comme le notebook) : on prend la FENÊTRE LA PLUS CONFIANTE,
    # pas le max par intention -- c'est le moment où le mot-clé est le plus net.
    conf_par_fenetre = probas.max(axis=1)
    meilleure = conf_par_fenetre.argmax()
    scores = {c: float(probas[meilleure, i]) for i, c in enumerate(classes)}

    # Règle de décision (identique au notebook, + garde-fous par page)
    prio = PRIORITE.get(page)
    marge = MARGE_AMBIGU_PAGE.get(page, MARGE_AMBIGU)
    tries = sorted(scores.items(), key=lambda x: -x[1])
    best, best_s = tries[0]
    second, second_s = tries[1] if len(tries) > 1 else (None, 0.0)

    # Paires acoustiquement proches : si elles occupent le top1/top2 et que l'écart
    # est faible, on refuse de trancher (évite de choisir CNI quand on a dit "électeur").
    paire_ambigue = False
    for a, b in PAIRES_STRICTES.get(page, []):
        if {best, second} == {a, b} and (best_s - second_s) < marge:
            paire_ambigue = True
            break

    if prio and scores.get(prio, 0) >= SEUIL:
        decision, raison = prio, "priorite_verbe_action"
    elif best_s < SEUIL:
        decision, raison = None, "rejet_score_faible"
    elif paire_ambigue:
        decision, raison = None, "rejet_ambigu_paire_proche"
    elif (best_s - second_s) < marge:
        decision, raison = None, "rejet_ambigu"
    else:
        decision, raison = best, "score_max"

    return {"intention": decision, "raison": raison, "scores": scores}


# ----------------------------------------------------------------------
# API
# ----------------------------------------------------------------------
app = FastAPI(title="N'ma SIM — API Vocale", version="1.0")

# CORS : autoriser l'app web à appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def accueil():
    return {
        "service": "N'ma SIM — API Vocale",
        "statut": "actif",
        "pages_disponibles": list(MODELES.keys()),
    }


@app.get("/sante")
def sante():
    """Vérifier que l'API et les modèles sont prêts."""
    return {
        "statut": "ok",
        "modeles_charges": list(MODELES.keys()),
        "modeles_manquants": [p for p in PAGES if p not in MODELES],
    }


@app.post("/comprendre")
async def comprendre(page: str = Form(...), audio: UploadFile = File(...)):
    """
    Endpoint principal.
    Entrée : page (choix_du_service | type_de_piece | motif_reactivation) + fichier audio.
    Sortie : intention détectée, raison, scores détaillés.
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

    # Vérifier que l'audio a du son
    niveau = float(np.max(np.abs(son))) if len(son) > 0 else 0.0
    if len(son) == 0 or niveau < 1e-4:
        return {
            "intention": None,
            "raison": "audio_vide",
            "message": "L'audio est silencieux. Demander au client de répéter.",
            "niveau_sonore": niveau,
        }

    resultat = detecter(son, page)
    resultat["niveau_sonore"] = niveau
    resultat["duree_s"] = round(len(son) / 16000, 2)

    # Message lisible pour l'app web
    if resultat["intention"] is None:
        resultat["message"] = "Je n'ai pas compris. Demander au client de répéter."
    else:
        resultat["message"] = f"Intention détectée : {resultat['intention']}"

    return resultat
