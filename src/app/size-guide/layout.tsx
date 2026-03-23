import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jewellery Size Guide India | Rings & Bangles",
  description: "Use the Swarna size guide to find the right fit for rings, bangles, and necklaces before you order.",
  alternates: {
    canonical: "/size-guide",
  },
};

export default function SizeGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
