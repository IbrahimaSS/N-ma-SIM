/**
 * Seed idempotent des forfaits eSIM (type Offre = SIM_ESIM).
 * Ne supprime rien : insère les forfaits manquants, met à jour ceux qui existent (par nom).
 *
 *   1. npx prisma db push      (applique l'enum SIM_ESIM + colonne formatSim)
 *   2. node seed-esim.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const { randomBytes } = require('crypto');

function cuid() {
  return 'c' + randomBytes(8).toString('hex') + Date.now().toString(36);
}

const FORFAITS = [
  {
    nom: 'eSIM Starter',
    description: "Idéal pour découvrir l'eSIM",
    prix: 15000,
    data: '3 Go',
    appels: '100 min',
    sms: '50 SMS',
    duree: '30 jours',
    couleur: '#4F46E5',
  },
  {
    nom: 'eSIM Pro',
    description: 'La solution équilibrée pour tous',
    prix: 25000,
    data: '8 Go',
    appels: 'Illimité',
    sms: '100 SMS',
    duree: '30 jours',
    couleur: '#1F0270',
  },
  {
    nom: 'eSIM Illimité',
    description: 'Pour les gros utilisateurs',
    prix: 45000,
    data: 'Illimité',
    appels: 'Illimité',
    sms: 'Illimité',
    duree: '30 jours',
    couleur: '#FFBA08',
  },
];

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  for (const f of FORFAITS) {
    const existing = await pool.query('SELECT id FROM "Offre" WHERE nom = $1', [f.nom]);
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE "Offre"
           SET description = $2, prix = $3, type = 'SIM_ESIM', data = $4, appels = $5,
               sms = $6, duree = $7, couleur = $8, "estActif" = true, "updatedAt" = NOW()
         WHERE nom = $1`,
        [f.nom, f.description, f.prix, f.data, f.appels, f.sms, f.duree, f.couleur],
      );
      console.log(`↻ Forfait eSIM mis à jour : ${f.nom} (${f.prix} GNF)`);
    } else {
      await pool.query(
        `INSERT INTO "Offre"
           (id, nom, description, prix, type, data, appels, sms, duree, couleur, "estActif", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'SIM_ESIM', $5, $6, $7, $8, $9, true, NOW(), NOW())`,
        [cuid(), f.nom, f.description, f.prix, f.data, f.appels, f.sms, f.duree, f.couleur],
      );
      console.log(`✓ Forfait eSIM créé : ${f.nom} (${f.prix} GNF)`);
    }
  }

  const res = await pool.query(`SELECT nom, prix, data, duree FROM "Offre" WHERE type = 'SIM_ESIM' ORDER BY prix`);
  console.log('\n=== Forfaits eSIM en base ===');
  res.rows.forEach((o) => console.log(`  - ${o.nom} : ${o.prix} GNF · ${o.data} · ${o.duree}`));

  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
