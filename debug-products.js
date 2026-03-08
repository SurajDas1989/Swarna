
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./src/generated/prisma');

const connectionString = process.env.DATABASE_URL;

async function testProducts() {
    console.log('Using DATABASE_URL:', connectionString.substring(0, 50) + '...');
    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('Fetching products...');
        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Found ${products.length} products in DB.`);

        if (products.length > 0) {
            const formatted = products.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category.slug,
                price: Number(p.price),
                image: p.images[0] || 'no-image',
            }));
            console.log('Sample Formatted Product:', formatted[0]);
        }
        console.log('Successfully fetched and formatted products.');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

testProducts();
