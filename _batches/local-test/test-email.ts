import { sendOrderReceiptEmail } from './src/lib/email';
import * as dotenv from 'dotenv';
dotenv.config();

// Create a dummy order object to test the receipt email
const dummyOrder = {
    id: `ORD-TEST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    total: 3500,
    items: {
        items: [
            {
                id: 'item1',
                name: 'Golden Pearl Necklace',
                price: 1500,
                quantity: 1
            },
            {
                id: 'item2',
                name: 'Diamond Studs',
                price: 2000,
                quantity: 1
            }
        ],
        shipping: {
            firstName: 'Suraj',
            lastName: 'Test',
            address: '123 Testing Lane',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        },
        paymentMethod: 'razorpay'
    }
};

async function testEmail() {
    console.log('Sending test receipt email to: info@swarnacollection.in with SMTP user:', process.env.SMTP_USER);
    // Send to the same email for testing, or another email if you prefer.
    const result = await sendOrderReceiptEmail(dummyOrder, 'msuraj2001@gmail.com');
    // I will try to use a dummy or standard testing email
    console.log('Email sending result:', result);
}

testEmail().catch(console.error);
