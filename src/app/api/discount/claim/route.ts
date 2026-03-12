import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

// Basic in-memory rate limiting map (IP -> timestamp)
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getIpFromRequest(request: Request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    return '127.0.0.1'; // Fallback
}

function generateDiscountCode() {
    // Generate a 4-character random alphanumeric string
    const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `SWARNA10-${randomStr}`;
}

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(request: Request) {
    try {
        const ip = getIpFromRequest(request);
        const now = Date.now();
        const lastRequestTime = rateLimitCache.get(ip);

        // Simple Rate Limit Check
        if (lastRequestTime && (now - lastRequestTime) < RATE_LIMIT_WINDOW_MS) {
            return NextResponse.json(
                { error: "Please wait a moment before trying again." },
                { status: 429 }
            );
        }
        
        // Update rate limit cache
        rateLimitCache.set(ip, now);
        
        // Cleanup old entries occasionally (simple approach)
        if (rateLimitCache.size > 1000) {
            rateLimitCache.clear();
        }

        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== 'string' || !isValidEmail(email)) {
            return NextResponse.json(
                { error: "Valid email address is required." },
                { status: 400 }
            );
        }

        const lowerEmail = email.toLowerCase().trim();

        // Check if email already exists
        const existingRecord = await prisma.discountCode.findUnique({
            where: { email: lowerEmail }
        });

        if (existingRecord) {
            // Return existing code
            return NextResponse.json({
                success: true,
                code: existingRecord.code,
                message: "Email already registered. Here is your code."
            });
        }

        // Generate a uniquely collision-resistant code
        let newCode = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            newCode = generateDiscountCode();
            const existingCode = await prisma.discountCode.findUnique({
                where: { code: newCode }
            });
            if (!existingCode) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
             return NextResponse.json(
                { error: "Could not generate a unique discount code. Please try again." },
                { status: 500 }
            );
        }

        // Save new record
        const newRecord = await prisma.discountCode.create({
            data: {
                email: lowerEmail,
                code: newCode
            }
        });

        return NextResponse.json({
            success: true,
            code: newRecord.code,
            message: "Discount code generated successfully."
        });

    } catch (error) {
        console.error("Discount Claim Error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
