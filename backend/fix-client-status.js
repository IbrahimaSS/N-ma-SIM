require('dotenv').config();
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      UPDATE "Client" c 
      SET statut = 'VALIDE' 
      FROM "DemandeSIM" d 
      WHERE d."clientId" = c.id 
        AND d.statut = 'VALIDEE' 
        AND c.statut = 'EN_ATTENTE'
    `);
    console.log('Clients mis à jour');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
