import prisma from "@/lib/prisma";
import { requireAdminOrStaff } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Verify Admin/Staff Status
    const user = await requireAdminOrStaff();
    if (!user) {
        return NextResponse.json({ error: 'Forbidden. Admin or Staff access required.' }, { status: 403 });
    }
    const body = await req.json();
    const { email, firstName, lastName, phone, address } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        address,
        role: "CUSTOMER"
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        orderCount: 0,
        totalSpent: 0
      }
    });

  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
