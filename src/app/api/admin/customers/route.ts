import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/supabase-server";
import { normalizePhone } from "@/lib/orders";

export async function GET(request: Request) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const query = (searchParams.get("q") || "").trim();
        const normalizedPhone = normalizePhone(query);

        const customers = await prisma.user.findMany({
            where: query
                ? {
                    OR: [
                        { email: { contains: query, mode: "insensitive" } },
                        { firstName: { contains: query, mode: "insensitive" } },
                        { lastName: { contains: query, mode: "insensitive" } },
                        ...(normalizedPhone ? [{ phone: { contains: normalizedPhone } }] : []),
                    ],
                }
                : { role: "CUSTOMER" },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 8,
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error("Admin customers search error:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}
