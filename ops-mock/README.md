# ops-mock

Mock du service OPS pour l'endpoint `POST /ops/provisioning` (action de création / activation d'un numéro prépayé AUC 4G).

Il permet de tester les applications qui appellent OPS **sans toucher au vrai provisioning** : il contrôle la requête, rejoue la liste des étapes du vrai OPS (HLR, OCS, PCRF) et renvoie toujours un succès si la requête est valide.

## Prérequis

- Java 17 ou plus
- Maven 3.9+

## Lancer le mock

```bash
mvn spring-boot:run
```

Le mock écoute sur **http://localhost:8089**.

Pour construire un jar exécutable :

```bash
mvn package
java -jar target/ops-mock-0.0.1.jar
```

## Exemple d'appel

```bash
curl -X POST "http://localhost:8089/ops/provisioning?login=test&pass=test" \
  -H "Content-Type: application/json" \
  -d '{
        "requestId": "109123",
        "typeAction": "ACTIVATION",
        "numero": "620000001",
        "sim": "611012050000001",
        "profil": "prepaid",
        "cle": "5"
      }'
```

Réponse (HTTP 200) :

```json
{
  "status": "0",
  "message": "HLR : Success | OCS : Success | PCRF : Success",
  "responses": [
    "CreationImsiAUCHLRRequest : 0",
    "CreationNumeroRequest : 0",
    "ActivationRequest : 0",
    "AjoutAPNRequest : 0",
    "ApnSupInfo4G : 0",
    "EpcBasic4GPrepaid : 0",
    "DoubleAppel2 : 0",
    "CREATION_NUMERO_PREPAID_OCS_REQUEST : 0",
    "CREATION_NUMERO_PREPAID_UPFC_REQUEST : 0"
  ],
  "conso": null
}
```

`CreationImsiAUCHLRRequest` n'apparaît que si `cle` est différente de `"0"`.

## Paramètres de la requête

Paramètres d'URL : `login` et `pass` (par défaut `test` / `test`).

| Champ | Obligatoire | Règle |
|---|---|---|
| `requestId` | oui | non vide |
| `typeAction` | oui | doit valoir `ACTIVATION` |
| `numero` | oui | exactement 9 caractères |
| `sim` | oui | exactement 15 caractères |
| `profil` | oui | `prepaid` ou `postpaid` (majuscules acceptées) |
| `cle` | non | non vide ; vaut `"0"` si absente |

## Réponses d'erreur

Toutes les erreurs renvoient `"status": "1"` avec un message explicite.

| Cas | HTTP | Message |
|---|---|---|
| Mauvais `login` / `pass` | 401 | `Invalid credentials` |
| `typeAction` absent | 400 | `Le typeAction doit etre defini. Utilisez ACTIVATION` |
| `typeAction` incorrect | 400 | `typeAction invalide : <valeur>. Utilisez ACTIVATION` |
| `numero` absent / mauvaise longueur | 400 | `Le numero est obligatoire` / `Le numero doit contenir 9 caracteres` |
| `sim` absente / mauvaise longueur | 400 | `La sim est obligatoire` / `La sim doit contenir 15 caracteres` |
| `profil` absent / inconnu | 400 | `Le profil est obligatoire` / `Le profil doit etre prepaid ou postpaid` |
| `cle` vide | 400 | `La cle ne doit pas etre vide` |
| Numéro déjà créé | 409 | `Le numero <numero> existe deja` |
| SIM déjà utilisée | 409 | `La sim <sim> est deja utilisee` |

Si plusieurs champs sont invalides, les messages sont séparés par ` | `.

## Numéros et SIM déjà créés

Chaque création réussie est ajoutée au fichier **`numeros-crees.txt`** (une ligne `numero;sim`), créé dans le dossier où le mock est lancé. Le fichier est relu au démarrage : les doublons sont donc détectés même après un redémarrage.

- Pour réutiliser un numéro ou une SIM : supprimer la ligne correspondante, puis redémarrer le mock.
- Pour repartir de zéro : supprimer le fichier, puis redémarrer le mock.

Le fichier n'est pas versionné (il est dans `.gitignore`).

## Configuration

Dans `src/main/resources/application.properties` :

| Propriété | Défaut | Rôle |
|---|---|---|
| `server.port` | `8089` | port d'écoute |
| `mock.login` / `mock.pass` | `test` / `test` | identifiants acceptés |
| `mock.numeros.file` | `numeros-crees.txt` | fichier des numéros et SIM déjà créés |

Chaque propriété peut être surchargée au lancement, par exemple :

```bash
java -jar target/ops-mock-0.0.1.jar --server.port=9090 --mock.numeros.file=/tmp/numeros.txt
```

## Tests

```bash
mvn test
```
