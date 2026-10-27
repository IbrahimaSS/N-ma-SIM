# Lancer la borne avec l'impression directe du reçu

Ces fichiers ouvrent la borne en **plein écran** avec l'**impression directe**. Quand le client clique sur **Imprimer**, le reçu sort tout de suite de l'imprimante : il n'y a plus de fenêtre d'impression, plus de choix « Enregistrer au format PDF », plus de deuxième clic.

| Navigateur | Fichier à double-cliquer |
|---|---|
| Google Chrome | `lancer-borne-chrome.bat` |
| Microsoft Edge | `lancer-borne-edge.bat` |
| Mozilla Firefox | `lancer-borne-firefox.bat` |

Utilise un seul navigateur sur la borne, toujours le même.

## 1. Choisir l'imprimante par défaut (une seule fois)

Le reçu part sur **l'imprimante par défaut de Windows**.

1. Ouvre **Paramètres → Bluetooth et appareils → Imprimantes et scanners**.
2. Désactive **« Laisser Windows gérer mon imprimante par défaut »**.
3. Clique sur l'imprimante de la borne (par exemple la HP DeskJet), puis sur **Définir par défaut**.

Si l'imprimante par défaut est « Microsoft Print to PDF », les reçus seront enregistrés en PDF au lieu d'être imprimés.

## 2. Lancer la borne

1. Démarre d'abord le **backend** et le **frontend** (et l'API scanner).
2. Double-clique sur le fichier de ton navigateur.
3. La borne s'ouvre en plein écran sur l'accueil.

Pour **quitter le plein écran** : **Alt + F4**.

**Pour la lancer au démarrage du PC :** appuie sur Windows + R, tape `shell:startup`, puis copie dans ce dossier un raccourci vers le fichier `.bat`.

## 3. Si une fenêtre d'impression s'ouvre encore

- **Chrome ou Edge :** ferme **toutes** les fenêtres de ce navigateur, puis relance le fichier `.bat`. Les options ne s'appliquent qu'à une fenêtre ouverte par le fichier.
- **Firefox :** même chose. Vérifie aussi que le fichier `user.js` existe dans `%LOCALAPPDATA%\NmaSIM\firefox-borne`.
- **Le reçu sort sur la mauvaise imprimante :** revois l'étape 1.

Chaque navigateur utilise ici un **profil séparé**, rangé dans `%LOCALAPPDATA%\NmaSIM\`. Il est distinct de la navigation habituelle du PC : au premier lancement, il faudra de nouveau autoriser la caméra pour la borne.
