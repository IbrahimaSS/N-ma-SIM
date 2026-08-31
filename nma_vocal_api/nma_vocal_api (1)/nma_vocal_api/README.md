# N'ma SIM — API Vocale

API de compréhension des intentions vocales (soussou) pour la borne N'ma SIM.

## Démarrage rapide
```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8100
```

Puis vérifier : http://localhost:8100/sante

## Fichiers
- `app.py` — l'API FastAPI
- `modeles/` — les 3 modèles entraînés (un par page)
- `GUIDE_INTEGRATION.md` — **guide complet pour le développeur** (à lire)
- `tester_api.py` — script de test en ligne de commande
- `requirements.txt` — dépendances

## L'essentiel
- Endpoint : `POST /comprendre` avec `page` + `audio`
- Renvoie l'intention détectée en JSON
- Voir GUIDE_INTEGRATION.md pour tous les détails
