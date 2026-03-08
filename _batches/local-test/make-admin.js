import { prisma } from './src/lib/prisma';

async function makeAdmin() {
    const email = 'surajnimaidas1989@gmail.com';
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log(`✅ Success: User ${user.email} is now an ${user.role}`);
    } catch (error) {
        console.error(`❌ Error promoting user ${email}:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
