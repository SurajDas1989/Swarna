import { getStorefrontProducts } from "@/lib/storefront-products";
import { CollectionPage } from "@/components/collections/CollectionPage";
import { Metadata } from "next";

interface CategoryPageProps {
    params: {
        category: string;
    };
}

const CATEGORY_META: Record<string, { title: string; description: string }> = {
    necklaces: {
        title: "Exquisite Necklaces",
        description: "Handcrafted pendants and statement necklaces that redefine luxury for every occasion.",
    },
    earrings: {
        title: "Designer Earrings",
        description: "From classic studs to dramatic jhumkas, discover earrings that capture the light.",
    },
    bangles: {
        title: "Signature Bangles",
        description: "Traditional craftsmanship meets modern elegance in our collection of bangles and bracelets.",
    },
    rings: {
        title: "Engagement & Party Rings",
        description: "Timeless rings set with precision to tell your unique story.",
    },
    sets: {
        title: "Bridal & Festive Sets",
        description: "Curated collections for your most memorable moments.",
    },
    bracelets: {
        title: "Elegant Bracelets",
        description: "Minimalist and statement bracelets for every wrist.",
    }
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const category = params.category.toLowerCase();
    const meta = CATEGORY_META[category] || { 
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Collection`,
        description: `Explore our collection of ${category}. Handcrafted with precision and elegance.`
    };

    return {
        title: `${meta.title} | Swarna Jewellery`,
        description: meta.description,
    };
}

export default async function CategoryCollectionPage({ params }: CategoryPageProps) {
    const category = params.category.toLowerCase();
    const products = await getStorefrontProducts({ category });
    const meta = CATEGORY_META[category] || { 
        title: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
        description: "Discover our premium selection of handcrafted jewellery."
    };

    return (
        <CollectionPage 
            title={meta.title}
            description={meta.description}
            products={products}
            categorySlug={category}
        />
    );
}
