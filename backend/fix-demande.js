require('dotenv').config();
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const offre = await pool.query('SELECT id FROM "Offre" WHERE nom = \'Recharge\' LIMIT 1');
    if (offre.rows.length > 0) {
      const offreId = offre.rows[0].id;
      await pool.query('UPDATE "DemandeSIM" SET "offreId" = $1 WHERE "numeroDossier" = \'NMA-1786713754508-E701E6\'', [offreId]);
      console.log('Fixed offreId for demande');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
