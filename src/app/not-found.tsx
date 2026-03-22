import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="text-8xl mb-6">😕</div>
      <h1 className="text-4xl font-bold text-foreground mb-4">404 - Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        We couldn&apos;t find the page you were looking for. It might have been moved, deleted, or never existed in the first place.
      </p>
      <Button asChild className="bg-primary hover:bg-primary-dark text-white rounded-full px-8 h-12 text-base">
        <Link href="/">Return to Homepage</Link>
      </Button>
    </div>
  );
}
