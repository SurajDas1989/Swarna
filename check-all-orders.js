const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function checkAllOrders() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('--- Orders Table Check ---');
        const orders = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."orders"`);
        console.log(`Total orders found: ${orders.length}`);
        orders.forEach(o => console.log(`Order ID: ${o.id}, User ID: ${o.userId}, Total: ${o.total}`));

        const users = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users"`);
        console.log(`\nTotal users in public.users: ${users.length}`);
        users.forEach(u => console.log(`User ID: ${u.id}, Email: ${u.email}`));

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkAllOrders();
