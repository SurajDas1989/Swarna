import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'], // Hide API routes and admin paths from crawlers
    },
    sitemap: 'https://swarna.vercel.app/sitemap.xml',
  };
}
