# Guide d'installation et d'intégration

Ce guide décrit la mise en route du dépôt N'ma SIM sur un poste de développement Windows. Les composants Python peuvent aussi avoir des instructions spécifiques à leur plateforme : consulter leur README avant un déploiement différent.

## 1. Prérequis

- Git.
- Node.js 20.9 ou plus récent et npm, pour les deux applications Next.js.
- PostgreSQL, accessible depuis le poste.
- Python 3.10 ou 3.11 pour l'API KYC ; Python 3.10+ pour le scanner. Installer Python depuis python.org avec l'option d'ajout au `PATH`.
- Java 17 et Maven 3.9+ pour le mock OPS.
- Windows et le pilote WIA du scanner pour la numérisation locale. L'imprimante/scanner doit être installée et connectée.
- Le distributeur SK-AD3 et son port série pour les tests sur matériel réel. Pour l'API vocale Malinké, prévoir également les poids de modèles nécessaires.

Ne pas installer toutes les dépendances Python dans un seul environnement virtuel : les services ont des versions et des usages différents. Créer un environnement séparé dans chaque service.

## 2. Récupérer le projet

```powershell
git clone <URL_DU_DEPOT>
cd N-ma-SIM
```

## 3. Installer les dépendances et démarrer les services

### Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Le frontend écoute sur http://localhost:3000. `npm ci` utilise le `package-lock.json` versionné.

### Backend et base de données

Dans un autre terminal :

```powershell
cd backend
npm ci
```

Créer `backend/.env` localement (ne pas le committer) et renseigner les connexions PostgreSQL et les secrets d'authentification :

```dotenv
DATABASE_URL="postgresql://<utilisateur>:<mot_de_passe>@<hote>:5432/<base>?schema=public"
DIRECT_URL="postgresql://<utilisateur>:<mot_de_passe>@<hote>:5432/<base>?schema=public"
JWT_SECRET="<secret-aleatoire-long>"
REFRESH_TOKEN_SECRET="<autre-secret-aleatoire-long>"
```

`DATABASE_URL` est utilisé par l'application et `DIRECT_URL` par la configuration des migrations Prisma. Ajouter les paramètres spécifiques à l'environnement, sans intégrer de secrets au dépôt.

Générer le client Prisma et appliquer les migrations :

```powershell
npm run db:generate
npm run db:migrate
npm run dev
```

Le backend écoute sur http://localhost:3001. `npm run db:migrate` nécessite une base PostgreSQL disponible et configurée.

### API KYC (facultative)

Dans `nma_kyc_api\nma_kyc_api` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

Cette API utilise FastAPI/Uvicorn, PaddleOCR/PaddlePaddle, OpenCV, InsightFace et ONNX Runtime. La première inférence peut nécessiter le téléchargement des modèles. Consulter son [README](../nma_kyc_api/nma_kyc_api/README.md) pour l'API, les formats d'entrée et les exigences de mémoire/disque.

### API vocale Soussou historique (facultative)

Dans `nma_vocal_api\nma_vocal_api (1)\nma_vocal_api` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8100
```

Il s'agit de l'API historique `/comprendre` avec modèles scikit-learn. Le frontend actuel n'envoie pas les requêtes Soussou à ce service : il utilise l'API vocale combinée Malinké/Soussou du dossier `nma_vocal_malinké` (port `8301`, endpoint `/predict`). Voir le [README historique de l'API Soussou](../nma_vocal_api/nma_vocal_api%20(1)/nma_vocal_api/README.md) et son `GUIDE_INTEGRATION.md` si ce service historique est utilisé indépendamment.

### API vocale Poular (facultative)

Dans `nma_vocal_api_poular\nma_vocal_api_poular` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8200
```

Voir le [README de l'API Poular](../nma_vocal_api_poular/nma_vocal_api_poular/README.md) et `GUIDE_INTEGRATION_POULAR.md`.

### API vocale Malinké (facultative)

Dans `nma_vocal_malinké` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Le port par défaut est `8301` (variable `NMA_PORT`). Le chemin des modèles peut être défini avec `NMA_MODELES_DIR`. Les poids de modèles volumineux ne sont pas nécessairement présents dans Git ; les obtenir depuis le stockage de modèles prévu pour le déploiement avant de lancer l'inférence.

### API Scanner locale (facultative, Windows)

Double-cliquer sur `Scanner\demarrer.bat` : le script crée `Scanner\.venv`, installe `Scanner\requirements.txt` et démarre l'API sur `127.0.0.1:8010`. Garder la fenêtre ouverte pendant l'utilisation de la borne.

Installation manuelle :

```powershell
cd Scanner
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python lancer_api.py
```

Vérifier http://127.0.0.1:8010/status. Cette API dépend de WIA et de `pywin32`, et nécessite un scanner Windows installé. Voir le [README Scanner](../Scanner/README.md) pour le dépannage matériel.

### Mock OPS (facultatif)

Depuis `ops-mock` :

```powershell
mvn test
mvn spring-boot:run
```

Le mock s'exécute sur http://localhost:8089. Les dépendances Java sont déclarées dans `pom.xml` et téléchargées par Maven. Pour brancher le backend au mock local, définir `OPS_URL=http://localhost:8089` dans `backend/.env`. Les paramètres `OPS_LOGIN` et `OPS_PASS` valent `test` par défaut pour le mock ; ne pas réutiliser ces valeurs en production.

### Pilote SK-AD3 (facultatif)

Pour le pilote Python autonome, dans `pilote_SK-AD3_NmaSIM` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install pyserial
python skad3.py ports
```

Les parcours de distribution de la borne utilisent également le paquet Node `serialport`, déjà déclaré dans `frontend/package.json`. Pour un test sans matériel, consulter le [guide SK-AD3](guide-distributeur-sk-ad3.md). Le branchement série et l'alimentation du distributeur doivent suivre la documentation du fabricant.

## 4. Relier les composants

Le frontend communique avec le backend sur `http://localhost:3001` par défaut. Pour adapter cette URL, définir `NEXT_PUBLIC_BACKEND_URL` dans `frontend/.env.local`. Les routes côté serveur du frontend utilisent `BACKEND_URL`, également par défaut sur le port `3001`.

Variables utiles pour les services optionnels, à définir dans `frontend/.env.local` :

```dotenv
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
SCANNER_API_URL=http://127.0.0.1:8010
VOCAL_API_URL_MALINKE=http://127.0.0.1:8301
VOCAL_API_URL_POULAR=http://127.0.0.1:8200
```

`SCANNER_API_URL`, `VOCAL_API_URL_MALINKE` et `VOCAL_API_URL_POULAR` ont ces valeurs par défaut. `VOCAL_API_URL_MALINKE` sert aux langues Malinké et Soussou, car les deux modèles sont servis par l'API combinée sur le port `8301`. L'API Soussou historique sur `8100` n'est pas utilisée par cette route du frontend. Pour configurer le distributeur physique ou le mode de simulation, utiliser les variables `SIM_DISPENSER_MODE`, `SIM_DISPENSER_PORT`, `SKAD3_ADRESSE` et `SIM_PIN1` dans l'environnement serveur approprié.

Les parcours de paiement, KYC et activation opérateur peuvent nécessiter d'autres services et identifiants externes. Configurer leurs variables uniquement à partir des informations de déploiement autorisées ; ne pas placer de clés privées dans des variables `NEXT_PUBLIC_*`.

## 5. Vérifications de base

- Frontend : http://localhost:3000
- Backend : http://localhost:3001
- KYC : http://127.0.0.1:8000/docs
- Scanner : http://127.0.0.1:8010/status
- Mock OPS : http://localhost:8089
- API vocale Soussou historique : http://127.0.0.1:8100/sante
- API vocale Poular : http://127.0.0.1:8200/sante
- API vocale Malinké : port `8301`, sauf surcharge `NMA_PORT`

Lancer chaque composant uniquement si le parcours testé en dépend. Les modèles d'IA peuvent nécessiter des téléchargements initiaux et plusieurs gigaoctets d'espace disque.

## 6. Fichiers et secrets à ne pas pousser

Les fichiers `.env`, `.env.local`, les mots de passe, les clés API, les exports de base de données, les environnements virtuels, `node_modules`, les artefacts Maven (`target`) et les poids de modèles doivent rester hors du contrôle de version. Les fichiers d'environnement cités dans ce guide sont des exemples de configuration à créer localement : ne pas y copier de secrets dans la documentation ou dans Git.
