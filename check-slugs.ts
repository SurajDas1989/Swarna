
import { prisma } from './src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function checkSlugs() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true }
    });

    console.log(`Total Products: ${products.length}`);
    const withSlugs = products.filter(p => p.slug && p.slug.length > 0);
    const withoutSlugs = products.filter(p => !p.slug || p.slug.length === 0);

    console.log(`Products with Slugs: ${withSlugs.length}`);
    console.log(`Products without Slugs: ${withoutSlugs.length}`);

    if (withoutSlugs.length > 0) {
      console.log("Samples without slugs:");
      console.log(withoutSlugs.slice(0, 5));
    } else {
      console.log("Samples with slugs:");
      console.log(withSlugs.slice(0, 5));
    }
  } catch (err) {
    console.error("Error in checkSlugs:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlugs();
