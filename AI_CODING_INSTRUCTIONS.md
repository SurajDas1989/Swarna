# AI Coding Instructions — Swarna Jewellery Store

## 🔒 SEO Rules (Apply to Every Single Change)

These rules are NON-NEGOTIABLE and must be applied 
automatically to every new page, component, or feature 
without being asked.

### Metadata
- Every new page MUST have a unique `title` and 
  `meta description` via `generateMetadata` or `layout.tsx`
- Private pages (login, signup, checkout, dashboard, 
  account, cart) MUST have:
  `robots: { index: false, follow: false }`
- Every page MUST have a canonical URL
- Static pages use `metadataBase` fallback
- Dynamic pages like `/product/[id]` must define 
  explicit canonical URLs in `generateMetadata`

### Heading Hierarchy
- Every page MUST have exactly ONE `<h1>` tag
- Heading order must follow H1 → H2 → H3 strictly
- NEVER skip heading levels
- NEVER introduce a second H1 on any page
- Modal and overlay components must use 
  `role="heading"` instead of heading tags

### Images
- ALWAYS use `next/image` — never use `<img>` tags
- Every image MUST have a descriptive keyword-rich 
  `alt` attribute
- NEVER use generic alt text like "image" or "photo"  
  or leave alt empty
- Hero images MUST use `priority` prop
- Below the fold images MUST use `loading="lazy"`

### Structured Data
- Homepage MUST have `Organization` and 
  `WebSite` JSON-LD schema
- Every product page MUST have `Product` JSON-LD 
  schema with name, image, price, currency, 
  and availability
- Category pages MUST have `BreadcrumbList` schema

### Rendering
- NEVER use client side rendering for content 
  that needs to be indexed by Google
- Always use SSG (`generateStaticParams`) for 
  product and category pages
- Use SSR only when data must be real-time

### Open Graph & Social
- Every page MUST have og:title, og:description, 
  og:image, og:url
- Every page MUST have twitter:card, twitter:title, 
  twitter:description, twitter:image
- og:image must be at least 1200x630 pixels

---

## ✅ Pre-Merge SEO Checklist

Before suggesting a merge or completing any feature, 
automatically verify:

- [ ] New pages have unique metadata
- [ ] Private pages have noindex
- [ ] One H1 per page, hierarchy is correct
- [ ] All images use next/image with descriptive alt
- [ ] Canonical URL is defined
- [ ] Schema added if it is a product or category page
- [ ] No client side rendered SEO content

---

## 🏗️ Tech Stack
- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Deployment: Vercel
- Domain: Swarna Premium Artificial Jewellery Store
