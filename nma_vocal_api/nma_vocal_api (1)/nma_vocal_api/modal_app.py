"""
modal_app.py — Déploiement de l'API vocale N'ma SIM sur Modal.com

Déployer : modal deploy modal_app.py
URL obtenue : https://support-nmasim--nma-vocal-api-serve.modal.run
"""

import modal
from app import app as fastapi_app

# 1. Définition de l'application Modal
app = modal.App("nma-vocal-api")

# 2. Définition de l'environnement (Image Docker)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi==0.115.0",
        "uvicorn[standard]==0.30.6",
        "python-multipart==0.0.9",
        "openwakeword==0.6.0",
        "onnxruntime==1.19.2",
        "librosa==0.11.0",
        "scikit-learn==1.9.0",
        "numpy<2.0",
    )
    # Téléchargement des modèles ONNX openWakeWord au build (sinon erreur au runtime)
    .run_commands("python -c \"import openwakeword; openwakeword.utils.download_models()\"")
    # Monter les modèles .pkl et le code source de l'API
    .add_local_dir("modeles", remote_path="/root/modeles")
    .add_local_file("app.py", remote_path="/root/app.py")
)

# 3. Déploiement de l'API FastAPI
@app.function(
    image=image,
    memory=2048, # 2 Go de RAM
    cpu=1.0,     # 1 coeur CPU
    # Garder au moins 1 instance chaude pour éviter le cold start vocal
    min_containers=1,
    # Timeout de 120s pour les requêtes
    timeout=120,
)
@modal.asgi_app()
def serve():
    return fastapi_app

