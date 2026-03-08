const { Client } = require('pg');

async function testConnection() {
    const url = process.env.DATABASE_URL;
    console.log('Testing connection to:', url.replace(/:[^:@]+@/, ':***@'));

    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connection successful!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0].now);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await client.end();
    }
}

testConnection();
