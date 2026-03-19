const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const code = 'BFF';
  const discountPercent = 10;
  const maxDiscount = 500;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`Creating demo coupon: ${code} via direct SQL...`);

  try {
    const query = `
      INSERT INTO discount_codes (id, code, "discountPercent", "maxDiscountAmount", "expiresAt", "isUsed", "createdAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())
      ON CONFLICT (code) DO UPDATE SET
        "isUsed" = false,
        "discountPercent" = $2,
        "maxDiscountAmount" = $3,
        "expiresAt" = $4
      RETURNING *;
    `;
    
    const res = await pool.query(query, [code, discountPercent, maxDiscount, expiresAt]);
    console.log('✅ Demo coupon created/updated:', res.rows[0]);
  } catch (err) {
    console.error('❌ SQL Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
