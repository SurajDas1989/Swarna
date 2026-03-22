import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductPageClient from './ProductPageClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    
    // Fetch product details from DB
    const product = await prisma.product.findUnique({ 
        where: { id },
        select: { name: true, description: true, images: true }
    });
    
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
    const product = await prisma.product.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            images: true,
            stock: true,
            category: {
                select: {
                    name: true
                }
            }
        }
    });

    const jsonLd = product ? [
        {
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
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: 'https://swarna.vercel.app/'
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Shop',
                    item: 'https://swarna.vercel.app/#products'
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: product.category.name,
                    item: 'https://swarna.vercel.app/#products'
                },
                {
                    '@type': 'ListItem',
                    position: 4,
                    name: product.name,
                    item: `https://swarna.vercel.app/product/${id}`
                }
            ]
        }
    ] : null;

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
