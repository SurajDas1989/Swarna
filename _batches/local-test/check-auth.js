const { Client } = require('pg');

async function checkAuth() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query('SELECT COUNT(*) FROM auth.users');
        console.log(`Users in auth.users: ${res.rows[0].count}`);

        const res2 = await client.query('SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5');
        console.log('\nLatest Auth Users:');
        res2.rows.forEach(r => console.log(`${r.id} | ${r.email} | ${r.created_at}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkAuth();
