import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { ReceiptEmail } from '@/emails/ReceiptEmail';
import { OrderStatusEmail } from '@/emails/OrderStatusEmail';
import { getOrderReference } from '@/lib/order-reference';

const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

type ReceiptOrderInput = {
    id: string;
    orderNumber?: string | null;
    createdAt?: string | Date;
    total: number | string;
    items: unknown;
};

export const sendOrderReceiptEmail = async (order: ReceiptOrderInput, customerEmail: string) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.warn('SMTP credentials not found. Email not sent.');
        return { success: false, message: 'SMTP credentials missing' };
    }

    try {
        const orderData = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const orderRef = getOrderReference({
            orderNumber: order.orderNumber,
            orderId: order.id,
            createdAt: order.createdAt,
        });

        const htmlContent = await render(
            ReceiptEmail({
                orderId: order.id,
                orderNumber: order.orderNumber ?? null,
                customerName: orderData.shipping?.firstName || 'Customer',
                items: orderData.items || [],
                total: Number(order.total),
                shippingAddress: orderData.shipping || {},
                billingAddress: orderData.billing || orderData.shipping || {},
                paymentMethod: orderData.paymentMethod || 'online',
                summary: orderData.summary,
            })
        );

        const mailOptions = {
            from: `"Swarna Collection" <${process.env.SMTP_USER}>`,
            to: customerEmail,
            subject: `Order Confirmation - ${orderRef}`,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending order receipt email:', error);
        return { success: false, error };
    }
};

export const sendOrderStatusEmail = async (
    orderId: string,
    customerEmail: string,
    customerName: string,
    status: string,
    orderNumber?: string | null,
    createdAt?: string | Date
) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.warn('SMTP credentials not found. Email not sent.');
        return { success: false, message: 'SMTP credentials missing' };
    }

    try {
        const orderRef = getOrderReference({ orderNumber, orderId, createdAt });

        const htmlContent = await render(
            OrderStatusEmail({
                orderId,
                orderNumber,
                customerName,
                status,
            })
        );

        const mailOptions = {
            from: `"Swarna Collection" <${process.env.SMTP_USER}>`,
            to: customerEmail,
            subject: `Order Update - ${orderRef} is now ${status}`,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Status update email sent: %s', info.messageId);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending order status email:', error);
        return { success: false, error };
    }
};


