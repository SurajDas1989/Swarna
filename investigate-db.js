const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function investigate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('--- Database Table Investigation ---');

        // 1. Get all tables in public schema
        const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        const names = tables.map(t => t.table_name);
        console.log('Tables found:', names.join(', '));

        // 2. Count rows in all tables
        for (const name of names) {
            if (name.toLowerCase().includes('order') || name.toLowerCase().includes('user') || name.toLowerCase().includes('cart') || name.toLowerCase().includes('product') || name.toLowerCase().includes('category')) {
                const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "public"."${name}"`);
                console.log(`Table "${name}": ${count[0].count} rows`);
            }
        }

        // 3. Details for surajnimaidas1989@gmail.com
        const email = 'surajnimaidas1989@gmail.com';
        const users = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users" WHERE email = $1`, email);
        if (users.length > 0) {
            const user = users[0];
            console.log(`\nFound user ${email} with ID ${user.id}`);

            for (const name of names) {
                if (name.toLowerCase().includes('order')) {
                    try {
                        const orders = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "public"."${name}" WHERE "userId" = $1`, user.id);
                        console.log(`Orders for user in "${name}": ${orders[0].count}`);
                    } catch (e) { }
                }
            }
        }

    } catch (error) {
        console.error('Investigation failed:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

investigate();
