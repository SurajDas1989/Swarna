import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { code, email, userId } = await request.json();

        if (!code || typeof code !== "string") {
            return NextResponse.json({ valid: false, error: "Coupon code is required." }, { status: 400 });
        }

        const coupon = await prisma.discountCode.findUnique({
            where: { code: code.trim().toUpperCase() },
        });

        if (!coupon) {
            return NextResponse.json({ valid: false, error: "Invalid coupon code." });
        }

        if (coupon.isUsed) {
            return NextResponse.json({ valid: false, error: "This coupon has already been used." });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ valid: false, error: "This coupon has expired." });
        }

        // Check user binding: if coupon has an email, validate it matches
        if (coupon.email) {
            const normalizedEmail = email?.toLowerCase().trim();
            if (normalizedEmail && normalizedEmail !== coupon.email) {
                return NextResponse.json({ valid: false, error: "This coupon is not valid for your account." });
            }
        }

        return NextResponse.json({
            valid: true,
            discountPercent: coupon.discountPercent,
            maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
        });
    } catch (error) {
        console.error("Coupon Validate Error:", error);
        return NextResponse.json({ valid: false, error: "Something went wrong." }, { status: 500 });
    }
}
