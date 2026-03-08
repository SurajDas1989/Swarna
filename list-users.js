import { prisma } from './src/lib/prisma';

async function listUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- Current Users in Database ---');
        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            users.forEach(user => {
                console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
            });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
