const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function investigateAllSchemas() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('--- Global Table Search ---');

        const tables = await prisma.$queryRawUnsafe(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `);

        for (const row of tables) {
            const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${row.table_schema}"."${row.table_name}"`);
            console.log(`[${row.table_schema}] "${row.table_name}": ${count[0].count} rows`);
        }

    } catch (error) {
        console.error('Investigation failed:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

investigateAllSchemas();
