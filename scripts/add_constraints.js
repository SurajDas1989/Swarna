import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  console.log("Applying Postgres CHECK constraints...");
  
  try {
    // Attempt to drop them first to avoid errors if rerunning
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_store_credit";`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_reserved_store_credit";`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_available_credit";`);
    
    // Create the constraints
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD CONSTRAINT "check_store_credit" CHECK ("storeCredit" >= 0);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD CONSTRAINT "check_reserved_store_credit" CHECK ("reservedStoreCredit" >= 0);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD CONSTRAINT "check_available_credit" CHECK ("storeCredit" - "reservedStoreCredit" >= 0);`);
    
    console.log("✅ Constraints successfully applied.");
  } catch (error) {
    console.error("❌ Failed to apply constraints", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
