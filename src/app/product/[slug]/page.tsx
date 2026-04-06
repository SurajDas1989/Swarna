import { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';
import { getCachedProductBySlug, getCachedProductById } from '@/lib/storefront-products';
import { notFound, redirect } from 'next/navigation';

function buildProductTitle(productName: string, categoryName: string) {
    const candidateTitles = [
        `${productName} | ${categoryName} Jewellery | Swarna`,
        `${productName} | Artificial Jewellery | Swarna`,
        `${productName} | Swarna`,
    ];

    return candidateTitles.find((title) => title.length <= 60) ?? candidateTitles[candidateTitles.length - 1];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    const product = await getCachedProductBySlug(slug);
    
    if (product) {
        return {
            title: {
                absolute: buildProductTitle(product.name, typeof product.category === 'string' ? product.category : 'Jewellery'),
            },
            description: product.description || undefined,
            alternates: {
                canonical: `/product/${slug}`,
            },
            openGraph: {
                title: buildProductTitle(product.name, typeof product.category === 'string' ? product.category : 'Jewellery'),
                description: product.description || undefined,
                images: product.images.length > 0 ? [{ url: product.images[0] }] : [],
            }
        };
    }
    
    return {
        title: 'Product Not Found',
    };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let product = await getCachedProductBySlug(slug);

    if (!product) {
        // Try fallback for legacy ID-based URLs only if it's a valid UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        let fallbackProduct = null;

        if (isUuid) {
            try {
                fallbackProduct = await getCachedProductById(slug);
            } catch (err) {
                console.error("Redirect fallback fetch error:", err);
            }
        }

        if (fallbackProduct) {
            redirect(`/product/${fallbackProduct.slug}`);
        }
        notFound();
    }

    const jsonLd = [
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
                    item: 'https://www.swarnacollection.in/'
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Shop',
                    item: 'https://www.swarnacollection.in/#products'
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: product.category,
                    item: 'https://www.swarnacollection.in/#products'
                },
                {
                    '@type': 'ListItem',
                    position: 4,
                    name: product.name,
                    item: `https://www.swarnacollection.in/product/${slug}`
                }
            ]
        }
    ];

    // Note: We reuse the [id]/ProductPageClient but it needs to handle the data fetching or we pass the product down.
    // However, the ProductPageClient in [id] probably uses params.id to fetch data on its own.
    // Let's check how ProductPageClient is implemented.
    
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductPageClient params={Promise.resolve({ id: product.id })} />
        </>
    );
}
