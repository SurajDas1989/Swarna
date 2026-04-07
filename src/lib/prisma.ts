import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

const globalForPrisma = global as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing. Configure it in your deployment environment.');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV !== 'production') {
    delete (global as any).prisma;
}

export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
