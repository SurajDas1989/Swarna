import type { Product } from "@/context/AppContext";

export function getProductCategoryLabel(category: Product["category"]) {
    if (typeof category === "string") return category;
    return category?.slug || category?.name || "";
}

export function getProductCategoryTitle(category: Product["category"]) {
    return getProductCategoryLabel(category)
        .split(/[-\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
