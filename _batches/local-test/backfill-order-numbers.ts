import prisma from './src/lib/prisma';

const sql = `
  UPDATE "orders"
  SET "orderNumber" = 'SW-' || to_char("createdAt", 'YYMMDD') || '-' || upper(right(replace(id, '-', ''), 6))
  WHERE "orderNumber" IS NULL;
`;

const run = async () => {
  const updated = await prisma.$executeRawUnsafe(sql);
  console.log(`Updated rows: ${updated}`);
  await prisma.$disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
