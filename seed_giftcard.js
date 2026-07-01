const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const giftId = crypto.randomUUID();
    const catRes = await pool.query('SELECT id FROM "categories" LIMIT 1;');
    if (catRes.rowCount === 0) {
      console.log('Nenhuma categoria encontrada');
      return;
    }
    const catId = catRes.rows[0].id;
    
    // Check if it already exists
    const existing = await pool.query('SELECT id FROM "gifts" WHERE "isGiftCard" = true;');
    if (existing.rowCount > 0) {
      console.log('Vale Presente já existe:', existing.rows[0].id);
      return;
    }

    await pool.query(`
      INSERT INTO "gifts" 
      (id, name, description, "imageUrl", "categoryId", value, "maxQuantity", "chosenQuantity", "isFeatured", "isGiftCard", "order", status, "allowedPaymentMethods", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, 0, 99999, 0, true, true, -1000, 'available', 'pix,card', NOW(), NOW())
    `, [
      giftId,
      'Vale Presente',
      'Não sabe o que escolher? Dê um Vale Presente com o valor que desejar e nós usaremos com muito carinho!',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
      catId
    ]);
    console.log('Vale Presente criado:', giftId);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
