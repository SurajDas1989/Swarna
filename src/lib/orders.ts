import prisma from "@/lib/prisma";

export function createOrderNumber() {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const shortHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SW-${datePart}-${shortHash}`;
}

export function normalizePhone(phone?: string | null) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function generateUniqueOrderNumber() {
    for (let i = 0; i < 5; i++) {
        const candidate = createOrderNumber();
        const existing = await prisma.order.findUnique({ where: { orderNumber: candidate } });
        if (!existing) return candidate;
    }

    return `${createOrderNumber()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
}
