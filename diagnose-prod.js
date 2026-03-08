
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./src/generated/prisma');

async function diagnose() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('❌ Error: DATABASE_URL not found in environment.');
        return;
    }

    console.log('--- 🔍 Production Diagnostics: Validation Check ---');
    if (!url.includes('@')) {
        console.error('❌ FATAL: DATABASE_URL is malformed (Missing @).');
        console.error(`Current Value: "${url}"`);
        console.error('Tip: Try running with "npx tsx diagnose-prod.js" to load your .env file.');
        return;
    }
    const isPooled = url.includes(':6543');
    const hasSsl = url.includes('sslmode=require') || url.includes('pgsslmode=require');
    const hasPgbouncer = url.includes('pgbouncer=true');

    console.log(`Connection URL (Hidden Creds): ${url.split('@')[1]}`);
    console.log(`- Port 6543 (Pooled): ${isPooled ? '✅ Yes' : '⚠️ No (Use 6543 for Vercel/Supabase)'}`);
    console.log(`- SSL Mode Required: ${hasSsl ? '✅ Yes' : '⚠️ Missing (Recommended: ?sslmode=require)'}`);
    console.log(`- Connection Pooling: ${hasPgbouncer ? '✅ Active' : '⚠️ Missing (Recommended: ?pgbouncer=true)'}`);

    // Initializing pg Pool with SSL support
    const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('\n--- 🛠️ Schema & Model Mapping ---');
        console.log('Model [Product] -> Target Table [products] (via @@map)');

        // --- Added Schema Search Path Check ---
        const searchPathRes = await pool.query('SHOW search_path');
        const currentSearchPath = searchPathRes.rows[0].search_path;
        console.log(`- Current DB Search Path: "${currentSearchPath}"`);

        if (!currentSearchPath.includes('public')) {
            console.warn('⚠️ WARNING: "public" is NOT in your search path. Prisma may not see your tables.');
        }

        console.log('\n--- 📊 Data Verification (NO FILTERS) ---');
        const productsCount = await prisma.product.count();
        const categoriesCount = await prisma.category.count();

        console.log(`- Total Products in [products] table: ${productsCount}`);
        console.log(`- Total Categories in [categories] table: ${categoriesCount}`);

        if (productsCount > 0) {
            const firstProduct = await prisma.product.findFirst({
                include: { category: true }
            });
            console.log('\n✅ Sample Product Data Found:');
            console.log(`- Name: "${firstProduct.name}"`);
            console.log(`- Category: "${firstProduct.category?.name || 'NULL (Relation Error)'}"`);
            console.log(`- Slug: "${firstProduct.slug}"`);
        } else {
            console.log('\n⚠️ WARNING: The [products] table is EMPTY.');
            console.log('Check if you are looking at the right Project Reference in your Supabase Dashboard.');
        }

    } catch (error) {
        console.error('\n❌ [FATAL ERROR] Prisma could not connect to database:');
        console.error(`Message: ${error.message}`);
        if (error.code === 'P2021') {
            console.error('Reason: The table does not exist. Did you run "npx prisma db push" yet?');
        }
    } finally {
        await pool.end();
        console.log('\n--- End of Diagnostics ---');
    }
}

diagnose();
