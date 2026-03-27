import { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';
import { getCachedProductById } from '@/lib/storefront-products';

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

    const product = await getCachedProductById(id);
    
    if (product) {
        return {
            title: {
                absolute: buildProductTitle(product.name, product.category),
            },
            description: product.description || undefined,
            alternates: {
                canonical: `/product/${id}`,
            },
            openGraph: {
                title: buildProductTitle(product.name, product.category),
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
    const product = await getCachedProductById(id);

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
                    name: product.category,
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
