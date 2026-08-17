require('dotenv').config();
const { Pool } = require('pg');
async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Get all offers to understand the data
  const offres = await pool.query('SELECT id, nom, prix FROM "Offre"');
  console.log("=== OFFRES ===");
  offres.rows.forEach(o => console.log(o));

  // Get the specific demande
  const demande = await pool.query(`
    SELECT d.id, d."numeroDossier", d.type, d.statut, d."offreId",
           o.nom as offre_nom, o.prix as offre_prix,
           p.montant as paiement_montant, p."methodePaiement", p.statut as paiement_statut
    FROM "DemandeSIM" d
    LEFT JOIN "Offre" o ON o.id = d."offreId"
    LEFT JOIN "Paiement" p ON p."demandeId" = d.id
    WHERE d."numeroDossier" = 'NMA-1786713754508-E701E6'
  `);
  console.log("\n=== DEMANDE ===");
  console.log(JSON.stringify(demande.rows, null, 2));
  
  pool.end();
}
run().catch(console.error);
