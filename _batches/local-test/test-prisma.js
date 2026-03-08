import { prisma } from './src/lib/prisma';

async function verifyMappings() {
    console.log('--- Database Verification Script ---');
    try {
        // 1. Test User Mapping (findUnique)
        console.log('Testing User mapping...');
        const user = await prisma.user.findFirst();
        if (user) {
            console.log(`✅ Success: Found user ${user.email}`);
            const sameUser = await prisma.user.findUnique({
                where: { email: user.email }
            });
            console.log(sameUser ? `✅ Success: findUnique works for email ${user.email}` : '❌ Error: findUnique returned null');
        } else {
            console.log('⚠️ Notice: No users found, count is:', await prisma.user.count());
        }

        // 2. Test Category Mapping (findMany)
        console.log('\nTesting Category mapping...');
        const categories = await prisma.category.findMany({ take: 3 });
        console.log(`✅ Success: Found ${categories.length} categories`);

        // 3. Test Order Mapping (count)
        console.log('\nTesting Order mapping...');
        const orderCount = await prisma.order.count();
        console.log(`✅ Success: Total orders: ${orderCount}`);

        // 4. Test Product Mapping (findMany)
        console.log('\nTesting Product mapping...');
        const products = await prisma.product.findMany({ take: 3 });
        console.log(`✅ Success: Found ${products.length} products`);

        console.log('\n--- All Tests Passed! ---');
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyMappings();
