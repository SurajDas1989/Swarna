import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const MOCK_PRODUCTS = [
    { name: 'Golden Pearl Necklace', category: 'necklaces', price: 1499, description: 'Elevate your look with this stunning golden pearl necklace. Featuring multiple strands of lustrous cream pearls held together by an intricate gold clasp, this piece embodies timeless elegance. Perfect for weddings, festive occasions, or adding a touch of luxury to any ensemble.', image: '/products/golden-pearl-necklace.png' },
    { name: 'Diamond Studs', category: 'earrings', price: 799, description: 'Classic brilliance meets everyday luxury. These diamond stud earrings feature dazzling brilliant-cut stones set in a sleek white gold finish. Lightweight and versatile, they transition seamlessly from office wear to evening glamour.', image: '/products/diamond-studs.png' },
    { name: 'Elegant Gold Bangles', category: 'bangles', price: 1299, description: 'A pair of exquisitely crafted gold bangles adorned with intricate filigree patterns and delicate gemstone accents. These bangles celebrate traditional Indian craftsmanship while maintaining a modern, wearable elegance.', image: '/products/gold-bangles.png' },
    { name: 'Ruby Statement Ring', category: 'rings', price: 599, description: 'Make a bold statement with this breathtaking ruby ring. A large oval-cut ruby takes center stage, surrounded by a halo of sparkling tiny diamonds, all set in warm gold. This piece commands attention at every gathering.', image: '/products/ruby-ring.png' },
    { name: 'Silver Chain Bracelet', category: 'bracelets', price: 299, description: 'Effortlessly chic, this silver chain bracelet features a delicate link design with charming pendant accents. Its minimalist aesthetic makes it a perfect everyday accessory that layers beautifully with other pieces.', image: '/products/silver-chain-bracelet.png' },
    { name: 'Bridal Jewellery Set', category: 'sets', price: 3499, description: 'A showstopping complete bridal set featuring an ornate gold necklace, matching jhumka earrings, maang tikka headpiece, and coordinating bangles. Studded with red and green gemstones, this set is designed to make every bride feel like royalty.', image: '/products/bridal-jewellery-set.png' },
    { name: 'Kundan Choker Necklace', category: 'necklaces', price: 1799, description: 'A traditional Kundan choker that embodies Mughal-era grandeur. Intricate gold foil work encases multicolored gemstones in a stunning pattern. This masterpiece pairs perfectly with both bridal and festive lehengas.', image: '/products/kundan-choker.png' },
    { name: 'Jhumka Earrings', category: 'earrings', price: 399, description: 'Beautiful Indian jhumka earrings featuring a classic bell shape in polished gold with delicate pearl drops and intricate temple-style filigree work. These jhumkas add instant elegance to any traditional outfit.', image: '/products/jhumka-earrings.png' },
    { name: 'Temple Design Bangles', category: 'bangles', price: 1499, description: 'A magnificent set of temple design bangles featuring sacred deity motifs and vibrant ruby accents. Inspired by South Indian temple architecture, these bangles are a celebration of heritage and artistry.', image: '/products/temple-bangles.png' },
    { name: 'Emerald Cocktail Ring', category: 'rings', price: 799, description: 'Turn heads with this stunning emerald cocktail ring. A generously sized emerald-cut green stone sits in an ornate vintage-inspired gold setting, flanked by sparkling diamond accents. Perfect for parties and special occasions.', image: '/products/emerald-cocktail-ring.png' },
    { name: 'Charm Bracelet', category: 'bracelets', price: 199, description: 'A whimsical gold charm bracelet adorned with delicate hanging pendants — hearts, stars, and nature-inspired leaves. Lightweight and playful, this bracelet is perfect for stacking or wearing solo as a conversation starter.', image: '/products/charm-bracelet.png' },
    { name: 'Party Wear Set', category: 'sets', price: 2499, description: 'Dazzle at every celebration with this glamorous party wear set. Featuring a statement necklace with crystal drops and matching chandelier earrings in a silver-gold tone, this set adds instant red-carpet drama to any outfit.', image: '/products/party-wear-set.png' }
];

function getHighlights(category: string) {
    switch (category) {
        case 'necklaces':
            return [
                'Face-framing finish: Adds polish to simple outfits and layered jewelry stories.',
                'Dress-up ease: Works for both everyday wear and special occasions.',
                'Balanced profile: Looks refined without feeling too heavy or ornate.',
            ];
        case 'earrings':
            return [
                'Instant framing: Creates a brighter, more expressive look around the face.',
                'Festive energy: Feels special enough for celebrations, yet wearable day-to-day.',
                'Movement and sparkle: Adds a sense of motion that makes the piece feel alive.',
            ];
        case 'bangles':
            return [
                'Everyday layering: Pairs beautifully with a watch, bangles, or a clean cuff look.',
                'Gift-ready feel: A polished piece that feels thoughtful without being too formal.',
                'Lightweight shine: Designed to add presence without overwhelming the wrist.',
            ];
        case 'rings':
            return [
                'Subtle statement: A small detail that still feels intentional and styled.',
                'Stacking friendly: Easy to pair with other rings or wear as a single accent.',
                'Elegant finish: Brings a refined touch to everyday hand styling.',
            ];
        case 'bracelets':
            return [
                'Everyday layering: Pairs beautifully with a watch, bangles, or a clean cuff look.',
                'Gift-ready feel: A polished piece that feels thoughtful without being too formal.',
                'Lightweight shine: Designed to add presence without overwhelming the wrist.',
            ];
        case 'sets':
            return [
                'Complete look: Makes dressing up simple by giving you a coordinated story.',
                'Occasion ready: A stronger choice when you want an effortless festive impact.',
                'Balanced styling: Designed to feel unified without looking overdone.',
            ];
        default:
            return [
                'Versatile styling: Works across casual, festive, and gifting moments with ease.',
                'Clean finish: Keeps the look refined, modern, and easy to pair.',
                'Premium feel: Brings a polished touch that elevates everyday dressing.',
            ];
    }
}

export async function GET() {
    try {
        const categories = Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)));
        for (const cat of categories) {
            await prisma.category.upsert({
                where: { slug: cat },
                update: {},
                create: { name: cat.charAt(0).toUpperCase() + cat.slice(1), slug: cat }
            });
        }

        for (const prod of MOCK_PRODUCTS) {
            const category = await prisma.category.findUnique({ where: { slug: prod.category } });
            await prisma.product.upsert({
                where: { slug: prod.name.toLowerCase().replace(/ /g, '-') },
                update: {
                    price: prod.price,
                    description: prod.description,
                    story: prod.description,
                    highlights: getHighlights(prod.category),
                    images: [prod.image],
                    categoryId: category!.id
                },
                create: {
                    name: prod.name,
                    slug: prod.name.toLowerCase().replace(/ /g, '-'),
                    description: prod.description,
                    story: prod.description,
                    highlights: getHighlights(prod.category),
                    price: prod.price,
                    images: [prod.image],
                    categoryId: category!.id,
                    stock: 50,
                    isFeatured: true
                }
            });
        }

        return NextResponse.json({ message: 'Seeded successfully' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
