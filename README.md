# N'ma SIM

Plateforme de borne interactive pour les parcours SIM : nouvelle souscription, réactivation, recharge et vérification d'identité. Le dépôt regroupe l'interface de la borne, l'API métier, ainsi que des services optionnels pour le KYC, la reconnaissance vocale, le scan de documents et le matériel.

## Composants

| Composant | Dossier | Rôle |
|---|---|---|
| Interface de la borne | `frontend/` | Application Next.js, port `3000` |
| API métier | `backend/` | Application Next.js et Prisma, port `3001`, PostgreSQL |
| API KYC | `nma_kyc_api/nma_kyc_api/` | OCR et vérification d'identité, port `8000` |
| API vocale Poular | `nma_vocal_api_poular/nma_vocal_api_poular/` | Reconnaissance vocale, port `8200` |
| API vocale Malinké et Soussou | `nma_vocal_malinké/` | Reconnaissance vocale locale, port `8301` |
| API vocale Soussou historique | `nma_vocal_api/nma_vocal_api (1)/nma_vocal_api/` | Ancienne API indépendante, port `8100` |
| API scanner | `Scanner/` | Scan local sous Windows via WIA, port `8010` |
| Mock opérateur OPS | `ops-mock/` | Simulation de provisioning, port `8089` |
| Pilote distributeur SK-AD3 | `pilote_SK-AD3_NmaSIM/` | Pilote Python et simulateur du distributeur SIM |

Les services KYC, vocaux, scanner et OPS sont facultatifs en fonction du parcours et du matériel déployés. Les clés, mots de passe, URL de base de données et autres secrets doivent rester dans des fichiers d'environnement locaux non versionnés.

## Démarrage et installation

Consulter le [guide d'installation et d'intégration](docs/guide-installation-integration.md) pour les prérequis, l'installation des dépendances de chaque service, la configuration locale, l'ordre de démarrage et les vérifications.

Les principales commandes de développement, depuis la racine du dépôt :

```powershell
cd backend
npm ci
npm run dev
```

Dans un deuxième terminal :

```powershell
cd frontend
npm ci
npm run dev
```

L'interface est disponible sur http://localhost:3000 et l'API métier sur http://localhost:3001. Une base PostgreSQL et les variables d'environnement décrites dans le guide sont nécessaires au fonctionnement complet.

## Documentation existante

- [Guide du distributeur SK-AD3](docs/guide-distributeur-sk-ad3.md)
- [Documentation du scanner](Scanner/README.md)
- [Documentation du mock OPS](ops-mock/README.md)
- Les README et guides d'intégration propres aux API KYC et vocales se trouvent dans leurs dossiers respectifs.
