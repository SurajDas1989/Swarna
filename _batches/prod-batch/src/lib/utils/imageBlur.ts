// src/lib/utils/imageBlur.ts

// A utility to generate a solid color or shimmering Skeleton base64 image 
// used for the blurDataURL property in Next.js Image component
// This gives a much more premium feel than an empty white box while the image loads over the network.

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="20%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
    typeof window === 'undefined'
        ? Buffer.from(str).toString('base64')
        : window.btoa(str);

/**
 * Returns a base64 encoded SVG string that can be used as a blurDataURL in Next.js Image.
 * Creates a subtle grey shimmering skeleton loader effect.
 */
export const getBlurDataUrl = () => `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`;
