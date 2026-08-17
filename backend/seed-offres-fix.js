require('dotenv').config();
const { Pool } = require('pg');
const { randomBytes } = require('crypto');

function cuid() {
  return 'c' + randomBytes(8).toString('hex') + Date.now().toString(36);
}

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Supprimer toutes les offres pour repartir sur une base propre
  await pool.query(`DELETE FROM "Offre"`);
  console.log("✓ Base d'offres réinitialisée");

  // Recréer les bonnes offres demandées par l'utilisateur
  const offres = [
    { nom: 'SIM Standard', description: 'Carte SIM', prix: 10000, type: 'SIM_STANDARD', actif: true },
    { nom: 'Recharge', description: 'Recharge de crédit', prix: 1000, type: 'RECHARGE', actif: true },
    { nom: 'Forfait Pass', description: 'Achat de forfait', prix: 2500, type: 'FORFAIT_PASS', actif: true },
    { nom: 'Dépôt', description: 'Dépôt Mobile Money', prix: 10000, type: 'DEPOT', actif: true },
  ];

  for (const offre of offres) {
    const id = cuid();
    await pool.query(
      `INSERT INTO "Offre" (id, nom, description, prix, type, "estActif", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, offre.nom, offre.description, offre.prix, offre.type, offre.actif]
    );
    console.log(`✓ Offre créée : ${offre.nom} (${offre.prix} GNF) [${offre.type}]`);
  }

  pool.end();
}

run().catch(console.error);
