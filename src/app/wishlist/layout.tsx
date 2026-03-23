import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist",
  description: "Review your saved Swarna jewellery pieces and move favorites into your cart.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
