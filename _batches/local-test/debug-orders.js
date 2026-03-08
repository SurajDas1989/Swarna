const { Client } = require('pg');

async function debugData() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. List all tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('--- Tables ---');
        console.log(tables.join(', '));

        // 2. Check counts for likely order tables
        for (const table of tables) {
            if (table.toLowerCase().includes('order') || table.toLowerCase().includes('user') || table.toLowerCase().includes('cart')) {
                const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`Table "${table}": ${countRes.rows[0].count} rows`);
            }
        }

        // 3. Specifically check User ID consistency
        const userRes = await client.query(`SELECT id, email FROM "users" WHERE email = 'surajnimaidas1989@gmail.com'`);
        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            console.log(`\nUser surajnimaidas1989@gmail.com ID: ${userId}`);

            // Check orders for this user in any table named like 'orders'
            for (const table of tables) {
                if (table.toLowerCase().includes('order')) {
                    try {
                        const orderCheck = await client.query(`SELECT COUNT(*) FROM "${table}" WHERE "userId" = $1`, [userId]);
                        console.log(`Orders for user in "${table}": ${orderCheck.rows[0].count}`);
                    } catch (e) {
                        // Some tables might not have userId column
                    }
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

debugData();
