import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "View your Swarna order confirmation and purchase summary.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
