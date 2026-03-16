import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductPageClient from './ProductPageClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    
    // Fetch product details from DB
    const product = await prisma.product.findUnique({ where: { id } });
    
    if (product) {
        return {
            title: product.name,
            description: product.description || undefined,
            alternates: {
                canonical: `/product/${id}`,
            },
            openGraph: {
                title: `${product.name} | Swarna`,
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
