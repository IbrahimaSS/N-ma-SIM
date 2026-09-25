# Suggestions reçues — 25/09/2026

Document de compréhension et d'explication des 5 suggestions transmises aujourd'hui, pour clarifier ce que chacune implique avant toute décision ou développement.

---

## 1. Création de compte Orange Money facultative — laisser le choix au client

**Ce que ça veut dire :** il s'agit précisément du **compte Orange Money**, pas d'un compte applicatif N'ma SIM. Aujourd'hui, rien dans le code actuel ne gère explicitement la création d'un compte Orange Money — la suggestion demande d'ajouter cette étape, mais en **laissant le client choisir** s'il veut qu'un compte Orange Money soit créé pour sa nouvelle ligne, plutôt que ce soit automatique/imposé.

**Pourquoi c'est proposé :** dans beaucoup d'usages télécom, une nouvelle SIM est automatiquement enrôlée en mobile money par l'opérateur, sans que le client l'ait explicitement demandé. Certains clients n'en veulent pas (ils ont déjà un compte OM sur un autre numéro, ou ne veulent pas de service financier lié à cette ligne). Laisser le choix évite l'imposition et respecte l'intention du client.

**Ce que ça implique concrètement :**
- Ajouter un écran de choix explicite (« Créer un compte Orange Money pour cette ligne » / « Non merci ») à un point du parcours nouvelle SIM (probablement après confirmation des infos, avant ou après le paiement).
- Comprendre comment la création d'un compte OM se déclenche actuellement côté Orange (automatique à l'activation de la ligne ? via une API/USSD séparée ?) — ça détermine si on doit juste ne rien faire quand le client refuse, ou activement empêcher une création automatique côté opérateur.
- Vérifier s'il existe déjà une intégration/API Orange Money dans le projet pour ce genre d'opération (au-delà du simple paiement par OTP déjà en place), ou si c'est à construire.

**Question à trancher :** comment la création de compte OM se déclenche-t-elle aujourd'hui en dehors de la borne, et qui (Orange, l'équipe technique) doit fournir le moyen technique de la déclencher/bloquer depuis l'appli ?

---

## 2. Possibilité de retrait sur la borne *(perspective)*

**Ce que ça veut dire :** à terme, la borne pourrait permettre à un client de **retirer de l'argent** (probablement lié à Orange Money), en plus de ses fonctions actuelles (SIM, recharge).

**Pourquoi c'est proposé :** ça transforme la borne d'un simple point SIM/recharge en un vrai point de service financier, ce qui augmente sa valeur et sa fréquentation.

**Ce que ça implique concrètement :**
- C'est explicitement marqué *"perspective"* → un objectif futur, pas une demande immédiate. Pas d'urgence de développement.
- Techniquement, ça nécessite une intégration beaucoup plus poussée avec Orange Money (retrait = mouvement d'argent sortant, pas juste un paiement entrant comme aujourd'hui) et probablement des exigences réglementaires/sécuritaires supplémentaires (cash physique à gérer dans la borne, ou retrait dématérialisé via un code).
- À garder en tête pour l'architecture (ne pas fermer de portes), mais à ne pas prioriser tant que ce n'est pas confirmé comme un chantier actif.

**Question à trancher :** aucune pour l'instant — c'est une piste, pas une commande. À reparler quand le sujet redevient concret.

---

## 3. Intégrer l'eSIM sur le parcours de réactivation

**Ce que ça veut dire :** aujourd'hui, l'eSIM n'existe que dans le parcours **"Nouvelle SIM"**. Cette suggestion demande d'étendre l'eSIM au parcours **"Réactivation"** aussi.

**Pourquoi c'est proposé :** cohérence de l'offre — un client qui réactive sa ligne devrait pouvoir choisir eSIM au même titre qu'un nouveau client, surtout si son téléphone est compatible et qu'il n'a pas de puce physique sous la main.

**Ce que ça implique concrètement :**
- C'est la suggestion la **plus concrète et la plus proche du code existant** des 5 : le parcours eSIM (compatibilité, forfait, génération, QR code) est déjà entièrement construit pour "Nouvelle SIM" — il s'agit de le brancher aussi sur "Réactivation", pas de le réinventer.
- Il faut définir le parcours exact : après le motif de réactivation, proposer un choix "Puce physique / eSIM" comme c'est fait pour Nouvelle SIM.
- Vérifier les cas limites : une réactivation eSIM a-t-elle un sens dans tous les cas (perte, vol, inactivité, blocage) ou seulement certains motifs ?

**Question à trancher :** l'eSIM en réactivation doit-elle être proposée pour tous les motifs de réactivation, ou seulement certains (ex : pas de sens si la puce est juste bloquée) ?

---

## 4. Revoir le modèle économique — licence/commission plutôt que "frais de commission"

**Ce que ça veut dire :** ce n'est pas un changement technique mais un changement de **positionnement commercial/contractuel**. Plutôt que de présenter la rémunération de la plateforme comme des "frais de commission" (perçu négativement, comme une charge prélevée sur le partenaire), la proposition est de la présenter comme une **licence par transaction ou par usage**.

**Pourquoi c'est proposé :** "frais de commission" sonne comme une ponction sur les revenus du partenaire (Orange, agences...) et peut être un point de friction en négociation. "Licence" positionne N'ma SIM comme un service/outil qu'on paie pour utiliser — une logique différente, souvent mieux acceptée dans une négociation B2B.

**Ce que ça implique concrètement :**
- C'est un sujet de **négociation commerciale**, pas de développement — aucune conséquence technique immédiate.
- Ça peut influencer la façon dont le système de facturation/reporting doit être pensé plus tard (facturer "par transaction" ou "par licence d'usage" peut avoir des implications différentes sur ce qu'on doit tracker : nombre de transactions, nombre de bornes actives, etc.)
- À terme, si le modèle "licence par transaction" est retenu, le backend devra pouvoir sortir des rapports clairs (nombre de transactions × tarif) pour justifier la facturation — ce que la base de données (Prisma) actuelle peut déjà probablement supporter, à vérifier plus tard.

**Question à trancher :** aucune côté produit pour l'instant — c'est à la personne en charge des négociations de trancher l'approche, on adapte le reporting ensuite si besoin.

---

## 5. Recommander des hôtels

**Ce que ça veut dire :** la borne pourrait suggérer des hôtels à certains utilisateurs — vraisemblablement les profils **"Étranger"**, qui viennent d'arriver et ont besoin d'une SIM *et* potentiellement d'un hébergement.

**Pourquoi c'est proposé :** valoriser le trafic de la borne au-delà de la SIM elle-même — un service complémentaire pertinent pour un voyageur qui vient d'arriver (aéroport, gare...), et une opportunité de partenariat/commission avec des hôtels.

**Ce que ça implique concrètement :**
- Fonctionnalité annexe, pas critique au parcours principal (SIM/recharge/réactivation).
- Nécessite un partenariat commercial avec des hôtels (accords, éventuellement des tarifs/commissions) avant même de penser à l'intégration technique.
- Techniquement assez simple une fois le partenariat en place : un écran de suggestions (liste ou carte) affiché à un moment pertinent du parcours (ex : après confirmation d'achat pour un profil "Étranger"), probablement une simple liste statique ou un lien externe au départ, avant d'envisager quelque chose de plus dynamique (API de réservation par exemple).

**Question à trancher :** qui gère la mise en relation avec des hôtels partenaires, et est-ce qu'on vise un simple affichage informatif ou une vraie réservation depuis la borne ?

---

## Synthèse — niveau de priorité/maturité de chaque suggestion

| # | Suggestion | Nature | Maturité |
|---|---|---|---|
| 1 | Compte Orange Money facultatif | Produit/UX + intégration Orange | À cadrer (comprendre le déclenchement côté Orange) |
| 2 | Retrait sur la borne | Produit/Finance | Perspective long terme, pas d'action immédiate |
| 3 | eSIM en réactivation | Technique | **La plus prête à démarrer** — réutilise l'existant |
| 4 | Licence vs commission | Commercial/Négociation | Aucune action technique pour l'instant |
| 5 | Recommandation d'hôtels | Partenariat/Produit | Dépend d'un accord commercial préalable |
