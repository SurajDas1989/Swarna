
import prisma from '../src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function backfill() {
  console.log("Starting slug backfill using project's prisma client...");
  
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true }
    });

    console.log(`Checking ${products.length} products...`);

    let updatedCount = 0;
    
    for (const product of products) {
      // Basic slug generation if missing
      if (!product.slug || product.slug.trim() === '') {
        const baseSlug = generateSlug(product.name);
        let finalSlug = baseSlug;
        let counter = 1;
        
        // Ensure uniqueness dynamically
        while (true) {
          const existing = await prisma.product.findUnique({
            where: { slug: finalSlug }
          });
          
          if (!existing) break;
          // If the one with the same slug is the same product (shouldn't happen since slug is empty), break
          if (existing.id === product.id) break;
          
          finalSlug = `${baseSlug}-${counter++}`;
        }
        
        await prisma.product.update({
          where: { id: product.id },
          data: { slug: finalSlug }
        });
        
        console.log(`Updated product: "${product.name}" -> ${finalSlug}`);
        updatedCount++;
      }
    }

    console.log(`Backfill complete. Updated ${updatedCount} products.`);
  } catch (err) {
    console.error("Error during backfill:", err);
  } finally {
    await prisma.$disconnect();
  }
}

backfill();
