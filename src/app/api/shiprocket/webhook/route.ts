import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Extract relevant payload data based on Shiprocket webhook payload
        const awbCode = body.awb;
        const currentStatus = body.current_status;

        if (!awbCode || !currentStatus) {
            console.warn('Invalid Shiprocket webhook payload received.', body);
            // Always return 200 so Shiprocket stops retrying invalid payloads
            return new NextResponse('OK', { status: 200 });
        }

        // Map Shiprocket Status to Our DB Status
        // Shiprocket Status strings e.g., 'DELIVERED', 'SHIPPED', 'CANCELLED', 'RTO INITIATED', etc.
        let mappedStatus: OrderStatus | null = null;
        const statusUpper = currentStatus.toUpperCase();

        if (statusUpper.includes('DELIVERED')) {
            mappedStatus = 'DELIVERED';
        } else if (statusUpper.includes('SHIPPED') || statusUpper.includes('IN TRANSIT') || statusUpper.includes('OUT FOR DELIVERY')) {
            mappedStatus = 'SHIPPED';
        } else if (statusUpper.includes('CANCELLED') || statusUpper.includes('RTO')) {
            mappedStatus = 'CANCELLED';
        }

        if (mappedStatus) {
            const order = await prisma.order.findFirst({
                where: { awbCode: awbCode }
            });

            if (order && order.status !== mappedStatus) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: mappedStatus }
                });
                console.log(`Updated Order ${order.id} status to ${mappedStatus} via Shiprocket webhook.`);
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Shiprocket Webhook Error:', error);
        // Shiprocket expects a 200 OK or it will keep retrying. Keep it to 200 even on catch if possible, 
        // but throw 500 if DB failed completely to force retry
        return new NextResponse('Internal Error', { status: 500 });
    }
}
