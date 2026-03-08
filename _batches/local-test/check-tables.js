import { prisma } from './src/lib/prisma';

async function checkTables() {
    try {
        const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('Existing tables in public schema:');
        console.table(result);
    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
