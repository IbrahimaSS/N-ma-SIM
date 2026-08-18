import modal
from app import app as fastapi_app

# 1. Définition de l'application Modal
app = modal.App("nma-kyc-api")

# 2. Définition de l'environnement (Image Docker)
# On installe les librairies systèmes requises par OpenCV et Paddle
image = modal.Image.debian_slim(python_version="3.11").apt_install(
    "libgl1",
    "libglib2.0-0",
    "libgomp1"
).pip_install(
    "fastapi==0.115.0",
    "uvicorn[standard]==0.30.6",
    "python-multipart==0.0.9",
    "paddlepaddle==3.2.0",
    "paddleocr>=3.0",
    "opencv-python==4.10.0.84",
    "numpy<2.0",
    "insightface==0.7.3",
    "onnxruntime==1.19.2",
    "rapidfuzz==3.9.7"
).env({
    "FLAGS_use_mkldnn": "0" # Fix pour Paddle sur CPU
}).add_local_dir("nma_kyc", remote_path="/root/nma_kyc")

# 3. Déploiement de l'API FastAPI
@app.function(
    image=image,
    memory=2048, # 2 Go de RAM
    cpu=2.0      # 2 coeurs CPU
)
@modal.asgi_app()
def serve():
    return fastapi_app
