# Image de base légère avec Python 3.11
FROM python:3.11-slim

# Dépendances système nécessaires à OpenCV et PaddleOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Contourne le bug oneDNN de Paddle 3.x sur CPU (défini AVANT tout import de paddle)
ENV FLAGS_use_mkldnn=0

# Installer les dépendances Python d'abord (meilleur cache Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY nma_kyc/ ./nma_kyc/
COPY app.py .

# Les modèles OCR et ArcFace se téléchargent au premier appel.
# (Optionnel : on pourrait les pré-télécharger ici pour un démarrage plus rapide.)

EXPOSE 8000

# Lancer le serveur (1 worker : le pipeline est lourd en RAM ; augmente selon la machine)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
