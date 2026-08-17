require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // or bcrypt

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT id, email, nom, role FROM "Utilisateur"');
    console.log("Users:", res.rows);
    
    const admin = res.rows.find(u => u.role === 'ADMIN') || res.rows[0];
    if (admin) {
      const bcryptLib = require('bcryptjs'); // project uses bcryptjs probably
      const hash = await bcryptLib.hash('admin123', 10);
      await pool.query('UPDATE "Utilisateur" SET "motDePasse" = $1 WHERE id = $2', [hash, admin.id]);
      console.log(`\nPassword reset to 'admin123' for ${admin.email}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
