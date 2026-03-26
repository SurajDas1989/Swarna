const { Client } = require('pg');

async function listAdmins() {
  const client = new Client({
    connectionString: "postgresql://postgres.vrfebojxpyfrertujgye:ShomikDas%4012345689Das@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const res = await client.query('SELECT email, role FROM "public"."users" WHERE role = \'ADMIN\'');
  console.log('Admins found:', res.rows);
  await client.end();
}

listAdmins().catch(console.error);
