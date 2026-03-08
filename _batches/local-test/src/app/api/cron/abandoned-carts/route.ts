import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import AbandonedCartEmail from '@/emails/AbandonedCartEmail';

// Create a Nodemailer transporter using Hostinger SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function GET(request: Request) {
    // Basic security to ensure this is only called by Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Calculate the threshold: Carts last updated more than 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find carts that are old, haven't had an email sent, and are NOT empty
        const abandonedCarts = await prisma.cart.findMany({
            where: {
                updatedAt: {
                    lt: twentyFourHoursAgo,
                },
                abandonedEmailSent: false,
                items: {
                    some: {} // Must have at least one item
                }
            },
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            // Process in batches so we don't blow up the server if there are hundreds
            take: 50
        });

        const emailsSent = [];
        const errors = [];

        for (const cart of abandonedCarts) {
            try {
                // Ensure we have an email address
                if (!cart.user?.email) continue;

                // Format items for the email template
                const formattedItems = cart.items.map(item => ({
                    name: item.product.name,
                    price: Number(item.product.price),
                    // @ts-ignore - Some older mock products used 'images' array, newer DB schema uses 'image' string or 'images' string[]
                    image: item.product.image || item.product.images?.[0] || '',
                }));

                const customerName = cart.user.firstName
                    ? `${cart.user.firstName} ${cart.user.lastName || ''}`.trim()
                    : 'Jewelry Lover';

                // Generate HTML from React Email template
                const emailHtml = await render(
                    AbandonedCartEmail({
                        customerName,
                        items: formattedItems,
                        cartUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://swarnacollection.in'}/#cart`
                    })
                );

                // Send the email
                await transporter.sendMail({
                    from: `"Swarna Collection" <${process.env.SMTP_USER}>`,
                    to: cart.user.email,
                    subject: 'You left something beautiful behind ✨',
                    html: emailHtml,
                });

                // Mark as sent in the database so we don't spam them tomorrow
                await prisma.cart.update({
                    where: { id: cart.id },
                    data: { abandonedEmailSent: true }
                });

                emailsSent.push(cart.user.email);
            } catch (err) {
                console.error(`Failed to send abandoned cart email to ${cart.user?.email}:`, err);
                errors.push(cart.id);
            }
        }

        return NextResponse.json({
            success: true,
            processed: abandonedCarts.length,
            sent: emailsSent.length,
            errors: errors.length
        });

    } catch (error) {
        console.error('Abandoned cart cron job error:', error);
        return NextResponse.json({ error: 'Failed to process abandoned carts' }, { status: 500 });
    }
}
