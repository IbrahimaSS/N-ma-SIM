# N'ma SIM — API KYC

Microservice de vérification d'identité pour la distribution automatisée de cartes SIM (Orange Guinée).

L'appli web envoie les photos d'une pièce d'identité + un selfie à cette API, qui renvoie une décision KYC (ACCEPTÉ / VÉRIFICATION MANUELLE / REJETÉ) avec les champs extraits.

Pièces supportées : **CNI CEDEAO** (recto + verso), **Passeport** (recto + verso), **Carte d'Électeur** (recto seul).

---

## 1. Ce que fait le service

Pour chaque demande, le pipeline :

1. **Prétraite** l'image (OpenCV : cadrage, amélioration).
2. **Lit le texte** (OCR PP-OCRv5 mobile — tourne sur CPU).
3. **Lit et valide la MRZ** (CNI et passeport) via les chiffres de contrôle ICAO — l'identité est ainsi *vérifiée*, pas seulement lue.
4. **Extrait les champs** (nom, prénom, date de naissance, numéro, etc.).
5. **Vérifie le visage** (InsightFace / ArcFace) : selfie vs photo de la pièce.
6. **Applique les règles métier** : âge minimum, pièce non expirée.
7. **Décide** : ACCEPTÉ / VÉRIFICATION MANUELLE / REJETÉ, avec un score de risque.

---

## 2. Installation (5 minutes)

**Prérequis** : Python 3.10 ou 3.11, environ 3 Go d'espace disque (pour les modèles), 4 Go de RAM minimum.

```bash
# 1. Se placer dans le dossier du projet
cd nma_kyc_api

# 2. Créer un environnement virtuel isolé
python -m venv .venv
source .venv/bin/activate          # sous Windows : .venv\Scripts\activate

# 3. Installer les dépendances
pip install -r requirements.txt
```

> ⚠️ **Important (CPU)** : le service désactive automatiquement oneDNN pour éviter un bug connu de PaddlePaddle 3.x sur CPU. C'est déjà géré dans le code (`FLAGS_use_mkldnn=0`).

---

## 3. Lancer le service

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

Au **premier appel**, le service télécharge les modèles (OCR + ArcFace, ~300 Mo). C'est automatique et ne se produit qu'une fois.

Vérifier que ça tourne : ouvrir http://localhost:8000 → doit afficher `{"service":"nma-sim-kyc","statut":"actif"}`.

**Documentation interactive** (pour tester à la souris) : http://localhost:8000/docs

---

## 4. Tester rapidement

Dans un second terminal (avec l'environnement activé) :

```bash
python test_client.py recto.jpg selfie.jpg verso.jpg
```

(Pour une carte d'électeur, omettre le verso : `python test_client.py recto.jpg selfie.jpg`.)

Ou en une ligne avec `curl` :

```bash
curl -X POST http://localhost:8000/kyc \
  -F "recto=@recto.jpg" \
  -F "selfie=@selfie.jpg" \
  -F "verso=@verso.jpg"
```

---

## 5. L'endpoint

### `POST /kyc`

**Entrée** (multipart/form-data) :

| Champ    | Type    | Obligatoire | Description |
|----------|---------|-------------|-------------|
| `recto`  | fichier | ✅ oui       | Photo du recto de la pièce |
| `selfie` | fichier | ✅ oui       | Selfie de la personne |
| `verso`  | fichier | ❌ non       | Verso (CNI et passeport ; à omettre pour la carte d'électeur) |

**Sortie** (JSON) :

```json
{
  "type_piece": "CNI",
  "decision": "✅ ACCEPTÉ",
  "risque": 0,
  "age": 21,
  "qualite": 2223.0,
  "cle": "2126102604070012",
  "champs": {
    "nom": "TOURE",
    "prenom": "MOHAMED DOUGAYA",
    "date_naissance": "26/10/2004",
    "sexe": "M",
    "numero_identite": "2126102604070012",
    "date_expiration": "16/06/2031"
  },
  "face": { "verifie": true, "similarite": 0.545, "seuil": 0.35, "erreur": null },
  "mrz": { "type": "CNI", "type_mrz": "TD1", "nom": "TOURE", "...": "..." },
  "details": [
    "Âge vérifié : 21 ans (>= 18) ✓",
    "Pièce valide jusqu'au 16/06/2031 ✓"
  ]
}
```

**Champs clés pour le frontend :**
- `decision` : à afficher à l'utilisateur. Commence par ✅ (accepté), ⚠️ (à vérifier), ou ❌ (rejeté).
- `age` : âge calculé (ou `null` si la date est illisible).
- `cle` : identifiant unique de la personne, à stocker côté N'ma SIM.
- `champs` : à pré-remplir dans le formulaire d'inscription.

---

## 6. Intégrer côté appli web (exemple JavaScript)

```javascript
// Envoyer les 3 images à l'API depuis le navigateur
async function verifierIdentite(rectoFile, selfieFile, versoFile) {
  const formData = new FormData();
  formData.append("recto", rectoFile);
  formData.append("selfie", selfieFile);
  if (versoFile) formData.append("verso", versoFile);

  const reponse = await fetch("http://localhost:8000/kyc", {
    method: "POST",
    body: formData,
  });

  if (!reponse.ok) throw new Error("Erreur KYC : " + reponse.status);

  const resultat = await reponse.json();

  // Exemple d'utilisation
  if (resultat.decision.startsWith("✅")) {
    console.log("Accepté ! Personne :", resultat.champs.nom, resultat.age, "ans");
    // -> pré-remplir le formulaire avec resultat.champs, stocker resultat.cle
  } else if (resultat.decision.startsWith("⚠️")) {
    console.log("À vérifier manuellement :", resultat.details);
  } else {
    console.log("Rejeté :", resultat.decision);
  }

  return resultat;
}
```

---

## 7. Réglages (dans `nma_kyc/core.py`, section config en haut)

| Paramètre | Défaut | Rôle |
|-----------|--------|------|
| `AGE_MINIMUM` | `18` | Âge minimum pour obtenir une SIM (à ajuster selon l'ARPT) |
| `SEUIL_VISAGE` | `0.35` | Seuil de similarité faciale (monter = plus strict) |
| `SEUIL_NETTETE_ELECTEUR` | `200` | En dessous, la carte d'électeur est jugée trop floue |
| `AUJOURD_HUI` | date du jour | Date de référence pour l'âge et l'expiration |

---

## 8. Déploiement avec Docker (optionnel)

```bash
docker build -t nma-kyc .
docker run -p 8000:8000 nma-kyc
```

---

## 9. Notes importantes

- **CORS** : par défaut, l'API accepte les requêtes de n'importe quelle origine (`allow_origins=["*"]`). **En production**, remplacer par l'URL exacte du frontend dans `app.py`.
- **Performance CPU** : compter ~2 à 5 secondes par vérification sur un CPU correct. La première requête est plus lente (chargement des modèles).
- **Sécurité** : cette API traite des données personnelles sensibles. Prévoir HTTPS, authentification, et une politique de conservation des images (ici, les fichiers temporaires sont supprimés après chaque requête).

## 10. KYC en ligne : liveness et capture caméra

Cette version est prête pour un **KYC en ligne à distance** (comme Binance, Izichange…), pas seulement un kiosque.

### Détection de vivacité (anti-spoofing) — déjà dans l'API

Le pipeline vérifie automatiquement, via le modèle **MiniFASNet** (Silent-Face-Anti-Spoofing, CPU) :
- **le selfie** : est-ce un vrai visage devant la caméra, ou une photo/écran ? Un faux selfie → **REJET**.
- **la pièce** : la scanne-t-on réellement, ou photographie-t-on un écran affichant une pièce ? → pénalité de risque.

La réponse JSON contient :
```json
"liveness_selfie": { "vrai": true, "score": 0.997, "erreur": null },
"liveness_piece":  { "vrai": true, "score": 0.94, "erreur": null }
```

> ⚠️ **Limite honnête** : cet anti-spoofing bloque les photos imprimées et les rejeux d'écran basiques, mais **ce n'est PAS une solution certifiée ISO/IEC 30107-3**. Pour une production critique traitant de vraies identités à grande échelle, envisager une solution commerciale certifiée. Pour un prototype ou un MVP, c'est un bon niveau de protection.

### Capture caméra en direct — côté appli (frontend)

L'ouverture de la caméra et la capture des photos se font **dans l'appli**, pas dans l'API. Un exemple complet et fonctionnel est fourni : **`exemple_capture_camera.html`**.

Pour le tester : ouvrir ce fichier dans un navigateur (idéalement sur téléphone, ou en HTTPS/localhost — la caméra ne marche pas en `http://` distant). Il guide l'utilisateur en 4 étapes (recto → verso → selfie → vérification) et envoie les images capturées à l'API.

Ton développeur peut s'en inspirer directement, ou reprendre juste la logique JavaScript (fonctions `demarrerCamera`, `capturer`, et l'envoi `FormData` à `/kyc`) dans son framework (React, Vue…).

Le seuil de liveness est réglable dans `nma_kyc/antispoof.py` (`SEUIL_LIVENESS = 0.55`).
