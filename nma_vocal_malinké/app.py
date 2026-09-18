"""
API N'ma SIM — Reconnaissance d'intentions vocales par (langue × page)
Modèle : wav2vec2-base fine-tuné, un par (langue, page).

Endpoint principal : POST /predict (multipart)
Port par défaut : 8301
"""
import os, io, json, time
from pathlib import Path
from contextlib import asynccontextmanager

import numpy as np
import torch
import librosa
from pydub import AudioSegment
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification

# ═════════════════════════════════════════════════════════════════════════
#   Configuration
# ═════════════════════════════════════════════════════════════════════════
# Chemin racine des modèles — surchargeable par variable d'environnement
# Exemple : export NMA_MODELES_DIR=/home/mohamed/nma_sim/modeles_par_page
RACINE_MODELES = os.environ.get('NMA_MODELES_DIR', './modeles_par_page')

PORT           = int(os.environ.get('NMA_PORT', 8301))
SAMPLE_RATE    = 16_000
MAX_DURATION   = 5.0
MAX_LENGTH     = int(SAMPLE_RATE * MAX_DURATION)
MIN_DURATION_S = 0.1

# Seuil de confiance minimum. En-dessous → non reconnu.
SEUIL_CONFIANCE_DEFAUT = 0.55

# Marge top1-top2. Si l'écart est trop faible, le modèle hésite → non reconnu.
MARGE_MIN_DEFAUT = 0.10

LANGUES = ['soussou', 'malinke']
PAGES   = ['choix_service', 'type_piece', 'motif_reactivation']

# Cache global des modèles (chargés une fois au démarrage)
MODELES = {}   # clé = (langue, page) → dict avec model, feature_extractor, id2label


# ═════════════════════════════════════════════════════════════════════════
#   Chargement des modèles
# ═════════════════════════════════════════════════════════════════════════
def charger_un_modele(langue: str, page: str) -> dict:
    """Charge un modèle wav2vec2 fine-tuné pour une (langue, page)."""
    model_dir = Path(RACINE_MODELES) / langue / page
    if not model_dir.exists():
        raise FileNotFoundError(f"Dossier introuvable : {model_dir}")

    label_map_file = model_dir / 'label_map.json'
    if not label_map_file.exists():
        raise FileNotFoundError(f"label_map.json manquant dans {model_dir}")

    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(str(model_dir))
    model = Wav2Vec2ForSequenceClassification.from_pretrained(str(model_dir))
    model.eval()

    with open(label_map_file) as f:
        lmap = json.load(f)
    id2label = {int(k): v for k, v in lmap['id2label'].items()}

    return {
        'model': model,
        'feature_extractor': feature_extractor,
        'id2label': id2label,
        'num_labels': len(id2label),
        'labels': list(id2label.values()),
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Charge les 6 modèles au démarrage, avant d'accepter des requêtes."""
    print("\n" + "═" * 66)
    print("🚀 N'ma SIM Voice API — chargement des modèles")
    print("═" * 66)
    print(f"📁 Racine modèles : {os.path.abspath(RACINE_MODELES)}")
    t0 = time.time()
    n_ok, n_ko = 0, 0
    for langue in LANGUES:
        for page in PAGES:
            key = (langue, page)
            try:
                MODELES[key] = charger_un_modele(langue, page)
                lbls = MODELES[key]['labels']
                print(f"  ✅ {langue:8s} / {page:20s} — {len(lbls)} classes : {lbls}")
                n_ok += 1
            except Exception as e:
                print(f"  ❌ {langue:8s} / {page:20s} — {e}")
                n_ko += 1
    dt = time.time() - t0
    print(f"\n⏱️  {n_ok}/6 modèles chargés en {dt:.1f}s")
    if n_ko > 0:
        print(f"⚠️  {n_ko} modèle(s) manquant(s) — l'API tourne mais rejettera ces (langue, page)")
    print(f"🌐 Écoute sur port {PORT}")
    print("═" * 66 + "\n")
    yield
    print("\n👋 Fermeture de l'API")
    MODELES.clear()


# ═════════════════════════════════════════════════════════════════════════
#   App FastAPI
# ═════════════════════════════════════════════════════════════════════════
app = FastAPI(
    title="N'ma SIM — Voice Intent API",
    description="Reconnaissance d'intentions vocales en soussou et malinké (approche par page).",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — mettre l'origine Vercel exacte en prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ⚠️ à restreindre en prod, ex : ["https://nma-sim.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═════════════════════════════════════════════════════════════════════════
#   Décodage audio
# ═════════════════════════════════════════════════════════════════════════
def bytes_to_waveform(audio_bytes: bytes, filename: str) -> np.ndarray:
    """Décode n'importe quel format courant en waveform float32 mono 16 kHz."""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'wav'

    # 1) WAV — chemin rapide via soundfile/librosa
    if ext in ('wav', 'flac'):
        try:
            waveform, _ = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE, mono=True)
            return waveform.astype(np.float32)
        except Exception:
            pass

    # 2) Autres formats — pydub (nécessite ffmpeg installé)
    fmt = ext if ext in ('mp3', 'ogg', 'webm', 'm4a', 'aac', 'flac', 'wav') else None
    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
        audio = audio.set_channels(1).set_frame_rate(SAMPLE_RATE)
        samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
        # Normalisation en fonction du sample_width (2 = PCM 16-bit → /32768)
        max_val = float(1 << (8 * audio.sample_width - 1))
        return samples / max_val
    except Exception as e:
        raise ValueError(f"Impossible de décoder l'audio ({ext}) : {e}")


# ═════════════════════════════════════════════════════════════════════════
#   Prédiction
# ═════════════════════════════════════════════════════════════════════════
def predire(langue: str, page: str, waveform: np.ndarray, seuil: float, marge_min: float) -> dict:
    """Fait tourner le modèle (langue, page) sur un waveform prêt."""
    key = (langue, page)
    m = MODELES[key]

    # Tronquer si trop long
    if len(waveform) > MAX_LENGTH:
        waveform = waveform[:MAX_LENGTH]

    inputs = m['feature_extractor'](
        waveform, sampling_rate=SAMPLE_RATE, return_tensors='pt', padding=True,
    )
    with torch.no_grad():
        logits = m['model'](**inputs).logits

    probs = torch.softmax(logits, dim=-1).squeeze().cpu().numpy()
    order = np.argsort(-probs)
    top1_id = int(order[0])
    top1_conf = float(probs[top1_id])
    top2_conf = float(probs[order[1]]) if len(order) > 1 else 0.0
    marge = top1_conf - top2_conf
    label = m['id2label'][top1_id]

    all_scores = {m['id2label'][i]: float(p) for i, p in enumerate(probs)}

    # Décisions de rejet : classe 'rien' | seuil trop bas | marge trop faible
    rejets = []
    if label == 'rien':
        rejets.append('classe_rien')
    if top1_conf < seuil:
        rejets.append('seuil')
    if marge < marge_min:
        rejets.append('marge')

    reconnu = len(rejets) == 0

    return {
        'langue': langue,
        'page': page,
        'label': label if reconnu else None,
        'label_brut': label,          # pour debug — ce que le modèle a vraiment prédit
        'confidence': top1_conf,
        'marge_top1_top2': marge,
        'reconnu': reconnu,
        'raisons_rejet': rejets,
        'all_scores': all_scores,
        'seuil_applique': seuil,
        'marge_min_appliquee': marge_min,
    }


# ═════════════════════════════════════════════════════════════════════════
#   Endpoints
# ═════════════════════════════════════════════════════════════════════════
@app.get('/')
def racine():
    return {
        'service': "N'ma SIM Voice API",
        'version': '1.0.0',
        'port': PORT,
        'modeles_charges': [f"{l}/{p}" for (l, p) in MODELES.keys()],
        'total_charges': len(MODELES),
        'endpoints': {
            'POST /predict': "audio (file) + langue (form) + page (form) [+ seuil, marge_min]",
            'GET  /health':  "vérifier que l'API tourne",
            'GET  /modeles': "info sur les modèles chargés",
        },
    }


@app.get('/health')
def health():
    return {
        'status': 'ok' if len(MODELES) > 0 else 'degraded',
        'modeles_charges': len(MODELES),
        'modeles_attendus': len(LANGUES) * len(PAGES),
    }


@app.get('/modeles')
def liste_modeles():
    return {
        f"{l}/{p}": {
            'num_labels': m['num_labels'],
            'labels': m['labels'],
        }
        for (l, p), m in MODELES.items()
    }


@app.post('/predict')
async def predict(
    audio: UploadFile = File(..., description="Fichier audio (wav/mp3/webm/ogg/m4a)"),
    langue: str = Form(..., description="'soussou' | 'malinke'"),
    page:   str = Form(..., description="'choix_service' | 'type_piece' | 'motif_reactivation'"),
    seuil:  float = Form(SEUIL_CONFIANCE_DEFAUT, description="Seuil de confiance [0,1]"),
    marge_min: float = Form(MARGE_MIN_DEFAUT, description="Écart minimum top1-top2 [0,1]"),
):
    """
    Reconnaissance d'intention pour une (langue, page).
    Retourne le label + confiance + tous les scores, avec logique de rejet
    (classe 'rien', seuil, marge).
    """
    # ─── Validation ─────────────────────────────────────────────────────
    if langue not in LANGUES:
        raise HTTPException(400, f"Langue inconnue : '{langue}'. Choix : {LANGUES}")
    if page not in PAGES:
        raise HTTPException(400, f"Page inconnue : '{page}'. Choix : {PAGES}")
    key = (langue, page)
    if key not in MODELES:
        raise HTTPException(503, f"Modèle non chargé pour {langue}/{page}. Vérifie {RACINE_MODELES}/")
    if not 0.0 <= seuil <= 1.0:
        raise HTTPException(400, f"Seuil hors [0, 1] : {seuil}")
    if not 0.0 <= marge_min <= 1.0:
        raise HTTPException(400, f"marge_min hors [0, 1] : {marge_min}")

    # ─── Lecture audio ──────────────────────────────────────────────────
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(400, "Fichier audio vide")

    t0 = time.time()
    try:
        waveform = bytes_to_waveform(audio_bytes, audio.filename or 'audio.wav')
    except ValueError as e:
        raise HTTPException(400, str(e))

    duree_s = len(waveform) / SAMPLE_RATE
    if duree_s < MIN_DURATION_S:
        raise HTTPException(400, f"Audio trop court : {duree_s:.2f}s (min {MIN_DURATION_S}s)")

    # ─── Inférence ──────────────────────────────────────────────────────
    result = predire(langue, page, waveform, seuil, marge_min)
    result['duree_audio_s'] = round(duree_s, 3)
    result['temps_inference_ms'] = int((time.time() - t0) * 1000)

    return result


# ═════════════════════════════════════════════════════════════════════════
#   Point d'entrée
# ═════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=PORT)
