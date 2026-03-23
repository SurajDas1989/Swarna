import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    currentPath: string;
    className?: string;
}

const SITE_URL = "https://swarna.vercel.app";

export function Breadcrumbs({ items, currentPath, className = "" }: BreadcrumbsProps) {
    const itemListElement = items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: `${SITE_URL}${item.href ?? currentPath}`,
    }));

    return (
        <>
            <nav
                aria-label="Breadcrumb"
                className={`flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ${className}`}
            >
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                            {item.href && !isLast ? (
                                <Link href={item.href} className="transition-colors hover:text-primary">
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    className={isLast ? "font-medium text-primary" : ""}
                                    aria-current={isLast ? "page" : undefined}
                                >
                                    {item.label}
                                </span>
                            )}

                            {!isLast ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                        </div>
                    );
                })}
            </nav>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement,
                    }),
                }}
            />
        </>
    );
}
