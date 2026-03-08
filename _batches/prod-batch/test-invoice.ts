import { sendOrderReceiptEmail } from './src/lib/email';
import * as dotenv from 'dotenv';
dotenv.config();

// Create a dummy COD order object to test the receipt email
const dummyOrder = {
    id: `ORD-COD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
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
            lastName: 'Das',
            address: '456 Test Street, Apartment 4B',
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700001'
        },
        paymentMethod: 'cod'
    }
};

async function testEmail() {
    const targetEmail = 'subarnaspradhan@gmail.com';
    console.log(`Sending test receipt email to: ${targetEmail} from SMTP user:`, process.env.SMTP_USER);

    // Using the sendOrderReceiptEmail function which uses the React Email template
    const result = await sendOrderReceiptEmail(dummyOrder, targetEmail);

    console.log('Email sending result:', result);
}

testEmail().catch(console.error);
