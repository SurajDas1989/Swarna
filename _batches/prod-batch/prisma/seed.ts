import { prisma } from '../src/lib/prisma'

const MOCK_PRODUCTS = [
    { id: 1, name: 'Golden Pearl Necklace', category: 'necklaces', price: 1499, originalPrice: 2499, image: '/products/golden-pearl-necklace.png', description: 'Elevate your look with this stunning golden pearl necklace. Featuring multiple strands of lustrous cream pearls held together by an intricate gold clasp, this piece embodies timeless elegance. Perfect for weddings, festive occasions, or adding a touch of luxury to any ensemble.' },
    { id: 2, name: 'Diamond Studs', category: 'earrings', price: 799, originalPrice: 1299, image: '/products/diamond-studs.png', description: 'Classic brilliance meets everyday luxury. These diamond stud earrings feature dazzling brilliant-cut stones set in a sleek white gold finish. Lightweight and versatile, they transition seamlessly from office wear to evening glamour.' },
    { id: 3, name: 'Elegant Gold Bangles', category: 'bangles', price: 1299, originalPrice: 1999, image: '/products/gold-bangles.png', description: 'A pair of exquisitely crafted gold bangles adorned with intricate filigree patterns and delicate gemstone accents. These bangles celebrate traditional Indian craftsmanship while maintaining a modern, wearable elegance.' },
    { id: 4, name: 'Ruby Statement Ring', category: 'rings', price: 599, originalPrice: 999, image: '/products/ruby-ring.png', description: 'Make a bold statement with this breathtaking ruby ring. A large oval-cut ruby takes center stage, surrounded by a halo of sparkling tiny diamonds, all set in warm gold. This piece commands attention at every gathering.' },
    { id: 5, name: 'Silver Chain Bracelet', category: 'bracelets', price: 299, originalPrice: 699, image: '/products/silver-chain-bracelet.png', description: 'Effortlessly chic, this silver chain bracelet features a delicate link design with charming pendant accents. Its minimalist aesthetic makes it a perfect everyday accessory that layers beautifully with other pieces.' },
    { id: 6, name: 'Bridal Jewellery Set', category: 'sets', price: 3499, originalPrice: 5999, image: '/products/bridal-jewellery-set.png', description: 'A showstopping complete bridal set featuring an ornate gold necklace, matching jhumka earrings, maang tikka headpiece, and coordinating bangles. Studded with red and green gemstones, this set is designed to make every bride feel like royalty.' },
    { id: 7, name: 'Kundan Choker Necklace', category: 'necklaces', price: 1799, originalPrice: 2799, image: '/products/kundan-choker.png', description: 'A traditional Kundan choker that embodies Mughal-era grandeur. Intricate gold foil work encases multicolored gemstones in a stunning pattern. This masterpiece pairs perfectly with both bridal and festive lehengas.' },
    { id: 8, name: 'Jhumka Earrings', category: 'earrings', price: 399, originalPrice: 899, image: '/products/jhumka-earrings.png', description: 'Beautiful Indian jhumka earrings featuring a classic bell shape in polished gold with delicate pearl drops and intricate temple-style filigree work. These jhumkas add instant elegance to any traditional outfit.' },
    { id: 9, name: 'Temple Design Bangles', category: 'bangles', price: 1499, originalPrice: 2299, image: '/products/temple-bangles.png', description: 'A magnificent set of temple design bangles featuring sacred deity motifs and vibrant ruby accents. Inspired by South Indian temple architecture, these bangles are a celebration of heritage and artistry.' },
    { id: 10, name: 'Emerald Cocktail Ring', category: 'rings', price: 799, originalPrice: 1299, image: '/products/emerald-cocktail-ring.png', description: 'Turn heads with this stunning emerald cocktail ring. A generously sized emerald-cut green stone sits in an ornate vintage-inspired gold setting, flanked by sparkling diamond accents. Perfect for parties and special occasions.' },
    { id: 11, name: 'Charm Bracelet', category: 'bracelets', price: 199, originalPrice: 499, image: '/products/charm-bracelet.png', description: 'A whimsical gold charm bracelet adorned with delicate hanging pendants — hearts, stars, and nature-inspired leaves. Lightweight and playful, this bracelet is perfect for stacking or wearing solo as a conversation starter.' },
    { id: 12, name: 'Party Wear Set', category: 'sets', price: 2499, originalPrice: 4499, image: '/products/party-wear-set.png', description: 'Dazzle at every celebration with this glamorous party wear set. Featuring a statement necklace with crystal drops and matching chandelier earrings in a silver-gold tone, this set adds instant red-carpet drama to any outfit.' }
]

const CATEGORIES = [
    { name: 'Necklaces', slug: 'necklaces' },
    { name: 'Earrings', slug: 'earrings' },
    { name: 'Bangles', slug: 'bangles' },
    { name: 'Rings', slug: 'rings' },
    { name: 'Bracelets', slug: 'bracelets' },
    { name: 'Sets', slug: 'sets' },
]

async function main() {
    console.log('Seeding database with Swarna products...')

    // Create Categories First
    for (const cat of CATEGORIES) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        })
    }
    console.log('✅ Categories created')

    // Create Products
    for (const prod of MOCK_PRODUCTS) {
        const dbCategory = await prisma.category.findUnique({
            where: { slug: prod.category }
        })

        if (!dbCategory) {
            console.warn(`Category ${prod.category} not found for product ${prod.name}`)
            continue
        }

        // Creating slugs from names (e.g., "Golden Pearl Necklace" -> "golden-pearl-necklace")
        const slug = prod.name.toLowerCase().replace(/\s+/g, '-')

        await prisma.product.upsert({
            where: { slug: slug },
            update: {
                price: prod.price,
                description: prod.description,
                images: [prod.image],
                stock: 50,
                isFeatured: true
            },
            create: {
                name: prod.name,
                slug: slug,
                price: prod.price,
                description: prod.description,
                images: [prod.image],
                stock: 50,
                categoryId: dbCategory.id,
                isFeatured: true
            },
        })
    }
    console.log('✅ Products created')
}

main()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Seeding completed successfully!')
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
