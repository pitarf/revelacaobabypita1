const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const resOrders = await pool.query('DELETE FROM "orders";');
    console.log(`Deletados ${resOrders.rowCount} pedidos de teste.`);
    const resGifts = await pool.query('UPDATE "gifts" SET "chosenQuantity" = 0;');
    console.log(`Estoque resetado para ${resGifts.rowCount} presentes.`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
