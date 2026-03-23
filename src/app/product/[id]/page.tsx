import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductPageClient from './ProductPageClient';

function buildProductTitle(productName: string, categoryName: string) {
    const candidateTitles = [
        `${productName} | ${categoryName} Jewellery | Swarna`,
        `${productName} | Artificial Jewellery | Swarna`,
        `${productName} | Swarna`,
    ];

    return candidateTitles.find((title) => title.length <= 60) ?? candidateTitles[candidateTitles.length - 1];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    
    // Fetch product details from DB
    const product = await prisma.product.findUnique({ 
        where: { id },
        select: { name: true, description: true, images: true, category: { select: { name: true } } }
    });
    
    if (product) {
        return {
            title: {
                absolute: buildProductTitle(product.name, product.category.name),
            },
            description: product.description || undefined,
            alternates: {
                canonical: `/product/${id}`,
            },
            openGraph: {
                title: buildProductTitle(product.name, product.category.name),
                description: product.description || undefined,
                images: product.images.length > 0 ? [{ url: product.images[0] }] : [],
            }
        };
    }
    
    return {
        title: 'Product Not Found',
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });

    const jsonLd = product ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images.length > 0 ? product.images[0] : '/products/golden-pearl-necklace.png',
        description: product.description || undefined,
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'INR',
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProductPageClient params={params} />
        </>
    );
}
