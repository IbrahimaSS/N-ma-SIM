# Scanner de pièces d'identité — API locale de la borne N'ma SIM

Ce dossier scanne la pièce posée sur la vitre de l'imprimante, **trouve la carte, la redresse et la découpe** (OpenCV), puis la renvoie à la borne. Tout se passe **en local, sur le PC branché à l'imprimante** : rien ne passe par Internet.

```
Borne (navigateur)  →  Next.js (localhost:3000)  →  API Scanner (127.0.0.1:8000)  →  Imprimante HP (WIA)
                                                   ←  carte découpée et redressée  ←
```

Si l'API n'est pas lancée, la borne utilise automatiquement l'ancien scan (`frontend/scripts/wia-scan.ps1`) et recadre l'image dans le navigateur : le scan fonctionne quand même, mais **sans redressement**.

---

## 1. Prérequis (une seule fois)

- **Windows** (le scan utilise WIA, intégré à Windows).
- **Imprimante branchée en USB et allumée**, pilote HP installé : elle doit apparaître dans *Paramètres → Bluetooth et appareils → Imprimantes et scanners*.
- **Python 3.10 ou plus récent** — à l'installation, cocher **« Add Python to PATH »**. Vérifier dans un terminal : `python --version`.
- **Node.js 18 ou plus récent** pour la borne — vérifier : `node --version`.
- Le projet à jour :
  ```
  git pull origin Soumah
  ```

## 2. Lancer l'API du scanner

**Méthode simple** : double-cliquer sur **`Scanner\demarrer.bat`**.
Il installe les dépendances (`requirements.txt`) puis lance l'API. La fenêtre doit afficher :
```
🚀  API Scanner : http://127.0.0.1:8000
```
**Laisser cette fenêtre ouverte** pendant toute l'utilisation de la borne.

**Méthode manuelle** (terminal dans le dossier `Scanner`) :
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python api_scanner.py
```

**Vérifier** : ouvrir http://127.0.0.1:8000/status dans le navigateur → `{"status":"ok", ...}`.
La documentation interactive est sur http://127.0.0.1:8000/docs (on peut y tester `/scan` directement).

## 3. Lancer la borne

Dans un **deuxième** terminal, à la racine du projet :
```
cd frontend
npm install
npm run dev
```
Puis ouvrir http://localhost:3000/borne/accueil.

Rien à configurer : la borne appelle `http://127.0.0.1:8000` par défaut. Pour une autre adresse ou un autre port, ajouter dans `frontend/.env.local` :
```
SCANNER_API_URL=http://127.0.0.1:8000
```

## 4. Utilisation

1. Dans la borne, choisir le **type de pièce** (CNI, Passeport, Carte d'électeur, Permis).
2. Poser la pièce sur la vitre, **fermer le capot**.
3. Appuyer sur **« Scanner (imprimante) »**.
4. La carte découpée s'affiche ; l'analyse démarre seule après 5 secondes.

Dans le terminal de la borne (`npm run dev`), chaque scan affiche une ligne de contrôle :
```
[SCANNER] API : 1031x650 (pièce découpée)                ← tout va bien
[SCANNER] API : 2550x3507 (scan complet, pièce non trouvée)  ← la borne recadre elle-même
[SCANNER] API http://127.0.0.1:8000 injoignable → repli sur wia-scan.ps1   ← l'API n'est pas lancée
```

## 5. Problèmes fréquents

| Symptôme | Solution |
|---|---|
| « Scanner introuvable » | Imprimante branchée et allumée ? Si le nom ne contient pas « DeskJet », modifier `NOM_SCANNER` dans `scanner.py` (mettre `""` pour prendre le premier scanner trouvé). |
| Le scan ne répond pas / reste bloqué | Fermer **HP Smart** ou tout autre logiciel qui utilise le scanner. |
| `injoignable → repli sur wia-scan.ps1` | L'API n'est pas lancée : relancer `demarrer.bat` et garder sa fenêtre ouverte. |
| Port 8000 déjà utilisé | Lancer avec un autre port : `set SCANNER_API_PORT=8010` puis `python api_scanner.py`, et mettre `SCANNER_API_URL=http://127.0.0.1:8010` dans `frontend/.env.local`. |
| `python` n'est pas reconnu | Réinstaller Python en cochant « Add Python to PATH », ou utiliser `py` à la place de `python`. |
| Carte non détectée | Pièce bien à plat, capot fermé, pas collée au bord de la vitre. La borne recadre quand même le scan complet. |

## 6. Organisation du code

| Fichier | Rôle |
|---|---|
| `api_scanner.py` | API locale (FastAPI) : `/scan`, `/scan-camera`, `/scan-base64`, `/status`. N'écoute que sur `127.0.0.1`. |
| `scanner.py` | Pilotage du scanner WIA (300 DPI, vitre entière) + choix de l'algorithme selon le type de pièce. |
| `scanner_carte_identite.py` / `scanner_carte_electeur.py` / `scanner_passeport.py` / `scanner_permis.py` | **Seule copie** de chaque algorithme de découpe : c'est ici qu'on les ajuste. |
| `borne.py` | Petite interface de test autonome (Tkinter), sans la borne Next.js : `python borne.py`. |
| `demarrer.bat` | Installe les dépendances et lance l'API. |

Types de pièce acceptés par l'API : `identite` / `cni`, `electeur` / `carte_electeur`, `passeport`, `permis`.
