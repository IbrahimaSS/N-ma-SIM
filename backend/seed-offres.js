require('dotenv').config();
const { Pool } = require('pg');
const { randomBytes } = require('crypto');

function cuid() {
  return 'c' + randomBytes(8).toString('hex') + Date.now().toString(36);
}

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Supprimer les mauvaises offres de test
  await pool.query(`DELETE FROM "Offre" WHERE nom IN ('Recharge', 'Forfait Pass', 'Dépôt', 'Virement')`);
  console.log("✓ Anciennes offres de test supprimées");

  // Créer les vraies offres N'ma SIM
  const offres = [
    { nom: 'SIM Standard', description: 'Carte SIM basique pour appels, SMS et services essentiels.', prix: 10000, type: 'SIM_STANDARD', actif: true },
    { nom: 'SIM + Internet', description: 'Carte SIM avec forfait data et services internet inclus.', prix: 20000, type: 'SIM_INTERNET', actif: true },
    { nom: 'SIM Étudiant', description: 'Offre spéciale étudiants avec tarifs préférentiels.', prix: 15000, type: 'SIM_ETUDIANT', actif: true },
    { nom: 'Réactivation de puce', description: "Réactivation d'une SIM existante avec conservation du numéro.", prix: 10000, type: 'RECHARGE', actif: true },
  ];

  for (const offre of offres) {
    const id = cuid();
    await pool.query(
      `INSERT INTO "Offre" (id, nom, description, prix, type, "estActif", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, offre.nom, offre.description, offre.prix, offre.type, offre.actif]
    );
    console.log(`✓ Offre créée : ${offre.nom} (${offre.prix} GNF)`);
  }

  // Vérification
  const result = await pool.query('SELECT nom, prix, type FROM "Offre" ORDER BY prix');
  console.log("\n=== OFFRES ACTUELLES ===");
  result.rows.forEach(o => console.log(`  - ${o.nom} : ${o.prix} GNF (${o.type})`));

  pool.end();
}

run().catch(console.error);
