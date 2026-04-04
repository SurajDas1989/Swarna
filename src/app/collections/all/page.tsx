import { getStorefrontProducts } from "@/lib/storefront-products";
import { CollectionPage } from "@/components/collections/CollectionPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Luxury Jewellery Collection | Swarna",
    description: "Explore the complete Swarna collection. Handcrafted necklaces, earrings, bangles, and more, designed for timeless elegance.",
};

export default async function AllCollectionsPage() {
    const products = await getStorefrontProducts({ category: "all" });

    return (
        <CollectionPage 
            title="The Full Collection"
            description="Explore our complete curation of handcrafted masterpieces. Each piece is a testament to timeless elegance and superior craftsmanship."
            products={products}
        />
    );
}
