import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        
        if (!user || (!user.email && !user.phone)) {
            return NextResponse.json({ available: false });
        }

        const conditions: any[] = [];
        if (user.email) conditions.push({ email: user.email.toLowerCase() });
        if (user.phone) conditions.push({ phone: user.phone });

        const availableCode = await prisma.discountCode.findFirst({
            where: {
                OR: conditions.length > 0 ? conditions : undefined,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (availableCode) {
            return NextResponse.json({
                available: true,
                code: availableCode.code,
                discountPercent: availableCode.discountPercent,
                maxDiscountAmount: availableCode.maxDiscountAmount ? Number(availableCode.maxDiscountAmount) : null,
            });
        }

        return NextResponse.json({ available: false });

    } catch (error) {
        console.error("Fetch Available Discount Error:", error);
        return NextResponse.json({ available: false, error: "Something went wrong." }, { status: 500 });
    }
}
