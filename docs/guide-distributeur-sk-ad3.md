# Guide : installer et tester le distributeur SK-AD3 sur la borne

Ce guide explique comment récupérer le code, brancher le distributeur de cartes **Syncotek SK-AD3** et faire sortir une première carte SIM active.

## Ce qui change dans la borne

Le distributeur **SK-AD3** remplace l'ancien distributeur Arduino. Quand le client clique sur **Terminer** :

1. Le SK-AD3 amène une carte au **lecteur de puce**.
2. Il lit l'**ICCID** et l'**IMSI** de la puce. Le PIN imprimé sur la carte (0000) est présenté **une seule fois**, et seulement si la puce l'exige. Une carte ne peut donc jamais être bloquée.
3. La ligne est **activée chez l'opérateur**, via OPS (simulé par `ops-mock` pour l'instant), pendant que la carte est encore dans la machine.
4. **Si l'activation réussit**, la carte est **présentée au client** et son numéro s'affiche à l'écran.
5. **Si quelque chose échoue**, la carte part au **bac de rejet** et ne sort pas. Si c'est la carte qui pose problème, la borne essaie automatiquement la suivante, une seule fois.

Le client n'a rien à faire : tout se passe en arrière-plan. Pour une **réactivation** avec le motif « perte », c'est le même déroulé. Pour les autres motifs, le client garde sa carte et aucune carte ne sort.

**Fichiers concernés :**
- `frontend/src/lib/materiel/skad3.ts` : le protocole du SK-AD3, traduit du pilote Python `pilote_SK-AD3_NmaSIM/skad3.py` ;
- `frontend/src/lib/materiel/distributeur.ts` : la connexion, la lecture de la carte, l'activation et le rejet ;
- `frontend/src/app/api/materiel/distribuer-sim/route.ts` : la route appelée par le bouton **Terminer**.

La documentation du fabricant (manuel, spécification, protocole) est dans `SK-AD3/`.

---

## 1. Récupérer le code

```
git pull
cd backend
npm install
npm run db:push
cd ../frontend
npm install
```

`npm run db:push` ajoute à la base les champs de l'activation : ICCID, IMSI, numéro attribué, solde des recharges. S'il affiche un avertissement « There might be data loss », réponds **`y`** : les nouvelles colonnes sont vides, rien n'est perdu.

## 2. Lancer le simulateur de l'opérateur (ops-mock)

Sans lui, toutes les activations échouent et **aucune carte ne sort** : elles partent toutes au bac de rejet.

1. Installe **Java 17** : `winget install --id EclipseAdoptium.Temurin.17.JDK -e`
2. Installe **Maven** (3.9 ou plus récent).
3. Récupère le mock : `git clone https://github.com/nouhou110512/ops-mock`
4. Dans ce dossier, lance `mvn spring-boot:run`. Attends la ligne `Started OpsMockApplication` : le mock écoute alors sur le port **8089**.

Laisse cette fenêtre ouverte pendant les tests.

## 3. Configurer le backend : `backend/.env`

Vérifie que ces lignes sont présentes :

```
OPS_URL=http://localhost:8089
OPS_LOGIN=test
OPS_PASS=test
OPS_PLAGE_NUMEROS=620900000-620999999
```

Redémarre ensuite le backend.

## 4. Brancher le distributeur

- **Alimentation :** 24 V continu, 2,5 A minimum. Le fil rouge est le +24 V, les fils noirs la masse.
- **Câble :** la prise DB9 (RS232) du distributeur va vers un **adaptateur USB-RS232** (puce FTDI ou CH340), branché sur le PC de la borne. Installe le pilote de l'adaptateur s'il n'est pas reconnu.
- **Port :** ouvre le **Gestionnaire de périphériques**, rubrique **Ports (COM et LPT)**, et note le port qui apparaît au branchement de l'adaptateur (par exemple `COM3`).
- **Adresse :** le sélecteur d'adresse sur la carte électronique du distributeur doit être sur **0**. Sinon, note sa valeur.
- **Cartes :** charge les cartes SIM dans l'empileur. Règle la **molette d'épaisseur** pour les supports de carte Orange.

## 5. Configurer la borne : `frontend/.env.local`

```
SIM_DISPENSER_PORT=COM3
# SKAD3_ADRESSE=0      (uniquement si le sélecteur n'est pas sur 0)
# SIM_PIN1=0000        (PIN imprimé sur les cartes, 0000 par défaut)
```

⚠️ **Sur la borne, il ne doit pas y avoir de ligne `SIM_DISPENSER_MODE=simulation`.** Elle sert uniquement sur un PC de développement sans matériel : avec elle, la borne ignore le vrai distributeur. Mets un `#` devant si elle est présente.

Redémarre ensuite le frontend.

## 6. Premier test

1. Vérifie que le **mock**, le **backend** et le **frontend** tournent.
2. Ouvre la borne sur **http://localhost:3000/borne/accueil**.
3. Fais une **Nouvelle SIM → SIM physique** jusqu'au bout, puis clique sur **Terminer**. N'ouvre pas directement l'adresse `?success=true` : ça saute toute l'étape de distribution.
4. **Ce qu'on doit voir :**
   - le bouton affiche « Activation de votre ligne… » ;
   - la carte sort à l'avant du distributeur ;
   - l'écran **Félicitations** affiche « **Votre nouveau numéro : 620 9x xx xx** ».
5. **Dans l'admin**, ouvre la fiche de la demande. La rubrique **Ligne opérateur** doit être « Activée », avec le numéro, l'IMSI et l'ICCID.

Au tout premier usage, la borne **initialise** le distributeur. S'il reste une carte dans le canal, elle part au bac de rejet : c'est normal.

## 7. Si la carte ne sort pas

**Ne relance pas plusieurs fois de suite.** Lis d'abord le message affiché à la borne et le journal du frontend : la fenêtre du serveur, ou le fichier `frontend/.next/dev/logs/next-development.log`. Chaque étape y laisse une ligne `[SK-AD3]` ou `[DISTRIBUER-SIM]`.

| Message | Cause probable | Que faire |
|---|---|---|
| « Aucun distributeur SIM détecté » | Port introuvable | Vérifie l'adaptateur USB et `SIM_DISPENSER_PORT` |
| « Le distributeur de cartes ne répond pas » | Pas de réponse sur le port | Dans l'ordre : alimentation 24 V, bon port COM, câble (TX et RX parfois inversés), adresse du sélecteur |
| « Plus de carte SIM disponible » | Empileur vide | Recharger les cartes |
| « Carte coincée dans le distributeur » | Bourrage | Dégager la carte, vérifier la molette d'épaisseur |
| « Service opérateur injoignable » / « non configuré » | Mock arrêté, ou `OPS_URL` absent | Relancer le mock, vérifier `backend/.env`, redémarrer le backend |
| « PIN de la carte refusé » | Le PIN des cartes n'est pas 0000 | Mettre le bon PIN dans `SIM_PIN1` |
| « Lecture de l'IMSI refusée » / erreurs 60 ou 61 | La puce n'est pas lue | Signaler à l'équipe avec la ligne du journal |

Dans tous ces cas, la carte est partie au **bac de rejet**. Pense à le vider de temps en temps.

**Tester le distributeur seul, sans la borne**, avec le pilote Python du fabricant (Python 3 et `pip install pyserial` nécessaires) :

```
cd pilote_SK-AD3_NmaSIM
python skad3.py ports
python skad3.py --port COM3 probe
python skad3.py --port COM3 init
python skad3.py --port COM3 status
python skad3.py --port COM3 iccid
```

Si ces commandes marchent mais pas la borne, le problème vient de la configuration de la borne (`.env.local`), pas du matériel.

## 8. Points à confirmer sur le vrai matériel

Ces points n'ont pas encore pu être vérifiés sans le distributeur. Merci de les noter pendant le test :

- **La lecture de l'IMSI** fonctionne, et le PIN des cartes est bien **0000**.
- **La tension acceptée par les SIM** : la borne essaie 5 V, puis 3 V si la puce refuse.
- **Le réglage de la molette d'épaisseur** pour les supports Orange.
- **Les capteurs** : les deux documentations du fabricant se contredisent sur la valeur « carte présente ». La borne n'en dépend pas pour l'instant.
