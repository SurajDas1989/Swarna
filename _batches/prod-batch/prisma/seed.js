// Seed script using raw pg driver to bypass Prisma 7 ESM issues
const { Client } = require('pg');

const CATEGORIES = [
    { name: 'Necklaces', slug: 'necklaces' },
    { name: 'Earrings', slug: 'earrings' },
    { name: 'Bangles', slug: 'bangles' },
    { name: 'Rings', slug: 'rings' },
    { name: 'Bracelets', slug: 'bracelets' },
    { name: 'Sets', slug: 'sets' },
];

const PRODUCTS = [
    { name: 'Golden Pearl Necklace', slug: 'golden-pearl-necklace', category: 'necklaces', price: 1499, image: '/products/golden-pearl-necklace.png', description: 'Elevate your look with this stunning golden pearl necklace. Featuring multiple strands of lustrous cream pearls held together by an intricate gold clasp, this piece embodies timeless elegance.' },
    { name: 'Diamond Studs', slug: 'diamond-studs', category: 'earrings', price: 799, image: '/products/diamond-studs.png', description: 'Classic brilliance meets everyday luxury. These diamond stud earrings feature dazzling brilliant-cut stones set in a sleek white gold finish.' },
    { name: 'Elegant Gold Bangles', slug: 'elegant-gold-bangles', category: 'bangles', price: 1299, image: '/products/gold-bangles.png', description: 'A pair of exquisitely crafted gold bangles adorned with intricate filigree patterns and delicate gemstone accents.' },
    { name: 'Ruby Statement Ring', slug: 'ruby-statement-ring', category: 'rings', price: 599, image: '/products/ruby-ring.png', description: 'Make a bold statement with this breathtaking ruby ring. A large oval-cut ruby takes center stage, surrounded by a halo of sparkling tiny diamonds.' },
    { name: 'Silver Chain Bracelet', slug: 'silver-chain-bracelet', category: 'bracelets', price: 299, image: '/products/silver-chain-bracelet.png', description: 'Effortlessly chic, this silver chain bracelet features a delicate link design with charming pendant accents.' },
    { name: 'Bridal Jewellery Set', slug: 'bridal-jewellery-set', category: 'sets', price: 3499, image: '/products/bridal-jewellery-set.png', description: 'A showstopping complete bridal set featuring an ornate gold necklace, matching jhumka earrings, maang tikka headpiece, and coordinating bangles.' },
    { name: 'Kundan Choker Necklace', slug: 'kundan-choker-necklace', category: 'necklaces', price: 1799, image: '/products/kundan-choker.png', description: 'A traditional Kundan choker that embodies Mughal-era grandeur. Intricate gold foil work encases multicolored gemstones.' },
    { name: 'Jhumka Earrings', slug: 'jhumka-earrings', category: 'earrings', price: 399, image: '/products/jhumka-earrings.png', description: 'Beautiful Indian jhumka earrings featuring a classic bell shape in polished gold with delicate pearl drops.' },
    { name: 'Temple Design Bangles', slug: 'temple-design-bangles', category: 'bangles', price: 1499, image: '/products/temple-bangles.png', description: 'A magnificent set of temple design bangles featuring sacred deity motifs and vibrant ruby accents.' },
    { name: 'Emerald Cocktail Ring', slug: 'emerald-cocktail-ring', category: 'rings', price: 799, image: '/products/emerald-cocktail-ring.png', description: 'Turn heads with this stunning emerald cocktail ring. A generously sized emerald-cut green stone sits in an ornate vintage-inspired gold setting.' },
    { name: 'Charm Bracelet', slug: 'charm-bracelet', category: 'bracelets', price: 199, image: '/products/charm-bracelet.png', description: 'A whimsical gold charm bracelet adorned with delicate hanging pendants — hearts, stars, and nature-inspired leaves.' },
    { name: 'Party Wear Set', slug: 'party-wear-set', category: 'sets', price: 2499, image: '/products/party-wear-set.png', description: 'Dazzle at every celebration with this glamorous party wear set. Featuring a statement necklace with crystal drops and matching chandelier earrings.' },
];

async function seed() {
    // Use DIRECT_URL for seeding (bypasses pgbouncer which doesn't support prepared statements)
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    console.log('Connecting to database...');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected!');

    // Create categories
    const categoryMap = {};
    for (const cat of CATEGORIES) {
        const res = await client.query(
            `INSERT INTO "Category" (id, name, slug, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET name = $1
       RETURNING id`,
            [cat.name, cat.slug]
        );
        categoryMap[cat.slug] = res.rows[0].id;
    }
    console.log('✅ Categories created:', Object.keys(categoryMap).join(', '));

    // Create products
    for (const prod of PRODUCTS) {
        const categoryId = categoryMap[prod.category];
        await client.query(
            `INSERT INTO "Product" (id, name, slug, description, price, stock, images, "categoryId", "isFeatured", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 50, $5, $6, true, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = $1, description = $3, price = $4, images = $5, "categoryId" = $6`,
            [prod.name, prod.slug, prod.description, prod.price, [prod.image], categoryId]
        );
    }
    console.log('✅ Products created:', PRODUCTS.length, 'items');

    await client.end();
    console.log('🎉 Seeding completed successfully!');
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
});
