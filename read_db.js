require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query(`SELECT id, name, "isGiftCard", value FROM gifts;`);
  console.log(res.rows);
  pool.end();
}
run();
