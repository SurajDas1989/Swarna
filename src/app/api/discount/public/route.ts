import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const coupons = await prisma.discountCode.findMany({
            where: {
                isUsed: false,
                email: null,
                phone: null,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                code: true,
                discountPercent: true,
                maxDiscountAmount: true,
                expiresAt: true
            }
        });

        return NextResponse.json(coupons);

    } catch (error) {
        console.error("Fetch Public Coupons Error:", error);
        return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
}
