import { prisma } from '../src/lib/prisma';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const code = 'BFF';
  const discountPercent = 10;
  
  console.log(`Creating demo coupon: ${code}...`);
  
  try {
    const coupon = await prisma.discountCode.upsert({
      where: { code },
      update: {
        isUsed: false,
        discountPercent,
        maxDiscountAmount: 500,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      create: {
        code,
        discountPercent,
        maxDiscountAmount: 500,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ Demo coupon upserted:', coupon.code, '(%', coupon.discountPercent, ')');
  } catch (err) {
    console.error('❌ Prisma Error:', err);
    throw err;
  }
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
