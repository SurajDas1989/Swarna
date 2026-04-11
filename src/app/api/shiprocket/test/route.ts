import { authenticate } from "@/lib/services/shiprocket";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const token = await authenticate();
        return NextResponse.json({ success: true, message: "Authentication successful", tokenPresent: !!token });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
