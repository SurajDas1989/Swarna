import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
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
