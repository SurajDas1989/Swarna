const { Client } = require('pg');

async function exhaustiveTableSearch() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('--- All Public Tables ---');
        const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        const tables = res.rows.map(r => r.tablename);
        console.log(tables.join(', '));

        // Check row counts for every single table found
        for (const table of tables) {
            const count = await client.query(`SELECT COUNT(*) FROM "public"."${table}"`);
            console.log(`Table "${table}": ${count.rows[0].count} rows`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

exhaustiveTableSearch();
