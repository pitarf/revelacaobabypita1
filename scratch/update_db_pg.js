const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  const res = await client.query(`
    UPDATE "payment_settings" 
    SET "mpAccessToken" = $1, "mpPublicKey" = $2
  `, [
    'APP_USR-4378253659446582-063013-8c4216a9d8aacafdc93dbc5300ea269e-1934658176',
    'APP_USR-c61fdd55-6e96-40bb-af6d-dc84d86007e7'
  ]);
  console.log('Updated rows:', res.rowCount);
}

run().catch(console.error).finally(() => client.end());
