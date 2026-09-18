"""
modal_app.py — Déploiement de l'API vocale MALINKÉ (+ Soussou wav2vec2) N'ma SIM sur Modal.com

Déployer : modal deploy modal_app.py
URL obtenue : https://support-nmasim--nma-vocal-api-malinke-serve.modal.run
"""

import modal
from app import app as fastapi_app

# 1. Définition de l'application Modal
app = modal.App("nma-vocal-api-malinke")

# Poids des modèles (soussou + malinke, 6 x ~360 Mo) : hébergés dans une Volume
# Modal dédiée plutôt qu'embarqués dans l'image. add_local_dir() sur des fichiers
# aussi gros se heurtait à un bug Windows (asyncio SelectorEventLoop) qui faisait
# planter l'upload avec des MemoryError répétées. `modal volume put` (upload
# séparé, avant déploiement) passe sans problème.
# Upload une fois : modal volume put nma-malinke-modeles modeles_par_page/malinke malinke -f
#                    modal volume put nma-malinke-modeles modeles_par_page/soussou soussou -f
volume = modal.Volume.from_name("nma-malinke-modeles", create_if_missing=True)

# 2. Définition de l'environnement (Image Docker)
image = (
    modal.Image.debian_slim(python_version="3.11")
    # ffmpeg requis par pydub pour décoder les formats audio non-WAV
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi==0.115.0",
        "uvicorn[standard]==0.30.6",
        "python-multipart==0.0.9",
        "numpy<2.0",
        "librosa==0.11.0",
        "soundfile==0.12.1",
        "pydub==0.25.1",
    )
    # Torch CPU-only via l'index dédié — évite de télécharger les wheels CUDA
    # (plusieurs Go inutiles, les autres services N'ma SIM tournent aussi en CPU sur Modal).
    .run_commands(
        "pip install torch==2.4.1 --index-url https://download.pytorch.org/whl/cpu"
    )
    .pip_install("transformers==4.44.2")
    # Code source de l'API — les modèles arrivent via la Volume montée ci-dessous
    .add_local_file("app.py", remote_path="/root/app.py")
)

# 3. Déploiement de l'API FastAPI
@app.function(
    image=image,
    volumes={"/root/modeles_par_page": volume},
    memory=4096,  # 4 Go de RAM — 6 modèles wav2vec2 chargés simultanément en mémoire
    cpu=2.0,      # 2 coeurs CPU
    # Garder au moins 1 instance chaude : le chargement des 6 modèles prend ~30-60s,
    # inacceptable en cold start pour une interaction vocale en temps réel.
    min_containers=1,
    # Timeout de 120s pour les requêtes
    timeout=120,
)
@modal.asgi_app()
def serve():
    return fastapi_app
