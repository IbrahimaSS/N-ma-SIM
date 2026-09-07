# N'ma SIM — API Vocale Poular

API de compréhension des intentions vocales en POULAR pour la borne N'ma SIM.

## Démarrage rapide
```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8200
```
Vérifier : http://localhost:8200/sante

## Particularité
Cette API a une catégorie "rien" : elle rejette le silence, le bruit et la parole hors-sujet
(renvoie intention=null), pour que la borne n'agisse que sur un vrai mot-clé.

## Fichiers
- app.py — l'API FastAPI
- modeles/ — les 3 modèles poular (avec catégorie "rien")
- GUIDE_INTEGRATION_POULAR.md — guide complet pour le développeur
- tester_api.py — test en ligne de commande
- requirements.txt — dépendances

Voir GUIDE_INTEGRATION_POULAR.md pour tous les détails.
